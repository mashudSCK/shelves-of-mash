import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

const modules = new Map();
const cache = new Map();
let calls = [];
let failNext = false;
let owner = null;
let writingTotal = 1205;
const client = createClient('http://127.0.0.1:54321', 'test-anon-key', {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: async (input, init) => {
    const url = new URL(input);
    calls.push({ url, init });
    if (failNext) { failNext = false; return new Response(JSON.stringify({ message:'temporary failure', code:'XX000' }), { status:500 }); }
    const table = url.pathname.split('/').at(-1);
    if (table === 'get_shelf_counts') return Response.json([{ shelf_id:'shelf', writing_count:1205 }]);
    if (table === 'get_archive_years') return Response.json([{ year:2026 }, { year:2025 }]);
    if (table === 'get_daily_writing_id') return Response.json('writing-1205');
    if (table === 'get_dashboard_stats') return Response.json({ totalWritings:1205,totalViews:9999 });
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = url.searchParams.has('id') ? 1 : Number(url.searchParams.get('limit') ?? 1000);
    const total = table === 'shelves' ? 2 : url.searchParams.has('tags_filter.tag.slug') ? 27 : writingTotal;
    const rows = Array.from({ length:Math.max(0,Math.min(limit,total-offset)) },(_,i)=>({
      id:String(offset+i).padStart(8,'0'),slug:`writing-${offset+i}`,title:`Writing ${offset+i}`,
      published_at:'2026-01-01T00:00:00Z', updated_at:'2026-01-01T00:00:00Z',
      shelf:{slug:'shelf',name:'Shelf'},tags:[],writing:{id:String(offset+i),slug:`writing-${offset+i}`,tags:[]},
    }));
    return new Response(init?.method === 'HEAD' ? null : JSON.stringify(rows), { headers:{'Content-Type':'application/json','Content-Range':`${offset}-${offset+rows.length-1}/${total}`} });
  } },
});
const privateClient = Object.create(client);
privateClient.auth = { getUser:async()=>({data:{user:owner ? {id:owner} : null}}) };
const mocks = {
  'server-only': {},
  '@/lib/supabase/public': { createPublicClient:()=>client },
  '@/lib/supabase/server': { createClient:async()=>privateClient },
  'next/cache': {
    unstable_cache:(fn,keys,options)=>(...args)=>{
      const key=JSON.stringify([keys,args]);
      if (!cache.has(key)) cache.set(key,Promise.resolve().then(()=>fn(...args)).catch(e=>{cache.delete(key);throw e;}));
      assert.equal(options.revalidate,120);
      return cache.get(key);
    },
    revalidateTag:(tag,profile)=>{assert.equal(tag,'public-content');assert.equal(profile.expire,0);cache.clear();},
  },
};
function load(name) {
  if (name in mocks) return mocks[name];
  const file = name.startsWith('@/') ? name.slice(2) : name;
  const full = path.resolve(file.endsWith('.ts') ? file : `${file}.ts`);
  if (modules.has(full)) return modules.get(full);
  assert.ok(fs.existsSync(full),`Missing implementation ${file}`);
  const exports={}; modules.set(full,exports);
  const source=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,require:load,console,process,Date,URL,URLSearchParams,Request,Response,setTimeout},{filename:full});
  return exports;
}
const {parsePage,pageRange}=load('lib/pagination');
for (const input of [undefined,'0','-5','Infinity','1.2','1e5','9007199254740993',['2']]) assert.equal(parsePage(input),1,String(input));
assert.equal(parsePage('3'),3);
assert.equal(pageRange(2,12).from,12);
assert.equal(pageRange(2,12).to,23);
assert.equal(pageRange(Infinity,9999).pageSize,100);
const writings=load('lib/data/writings');
const first=await writings.getArchiveWritings({tag:'rare',page:1});
assert.equal(first.writings.length,12);assert.equal(first.total,27);
const query=calls.at(-1).url.searchParams;
assert.ok(query.get('select').includes('!inner'),'Tags must use inner joins before pagination');
assert.equal(query.get('tags_filter.tag.slug'),'eq.rare');
assert.equal(query.get('order'),'published_at.desc.nullslast,id.desc');
assert.equal(query.get('limit'),'12');
const before=calls.length;
await writings.getArchiveWritings({tag:'rare',page:1});
assert.equal(calls.length,before,'Identical public reads reuse cache');
const {invalidatePublicContent}=load('lib/data/public-cache');
invalidatePublicContent();
await writings.getArchiveWritings({tag:'rare',page:1});
assert.equal(calls.length,before+1,'Invalidation causes a fresh read');
invalidatePublicContent(); failNext=true;
await assert.rejects(writings.getArchiveWritings({tag:'rare',page:2}));
assert.equal((await writings.getArchiveWritings({tag:'rare',page:2})).writings.length,12,'Failures must not be cached as empty lists');
const counts=await writings.getShelfCounts();assert.equal(counts.shelf,1205);
assert.deepEqual(Array.from(await writings.getArchiveYears()),[2026,2025]);
await writings.getThoughtOfTheDay();
assert.ok(calls.some(c=>c.url.pathname.endsWith('get_daily_writing_id')));
const bookmarks=load('lib/data/bookmarks');
assert.equal((await bookmarks.getBookmarkedWritings(1)).total,0);
owner='reader-a'; await bookmarks.getBookmarkedWritings(2);
assert.equal(calls.at(-1).url.searchParams.get('user_id'),'eq.reader-a');
assert.equal(calls.at(-1).url.searchParams.get('offset'),'12');
owner='reader-b'; await bookmarks.getBookmarkedWritings(2);
assert.equal(calls.at(-1).url.searchParams.get('user_id'),'eq.reader-b','Private reads cannot share cache');
const admin=load('lib/data/admin');await admin.getWritingsByStatus('draft',2);
assert.equal(calls.at(-1).url.searchParams.get('limit'),'20');
assert.equal(calls.at(-1).url.searchParams.get('select'),'id,title,slug,updated_at,status');
console.log('PASS: pagination, database tag filters, cache reuse/invalidation/failure, aggregates, private isolation, bounded admin reads');
const sitemap=load('lib/data/sitemap');
let manifest=await sitemap.getSitemapManifest();
assert.equal(manifest.writings,1205);
let entries=await sitemap.getSitemapEntries(0);
assert.equal(entries.length,1211,'Sitemap must include every writing, both shelves and static routes');
assert.equal(new Set(entries.map(e=>e.url)).size,1211);
writingTotal=50005;invalidatePublicContent();
manifest=await sitemap.getSitemapManifest();assert.equal(manifest.pages,2);
entries=await sitemap.getSitemapEntries(1);
assert.equal(entries.length,11,'Split sitemap includes all URLs after 50,000 boundary');
assert.equal((await sitemap.getSitemapEntries(2)).length,0);
console.log('PASS: complete 1,205-writing sitemap and 50,000-URL split boundary');
const sitemapRoute=load('app/sitemap.xml/route');
const sitemapIndex=await sitemapRoute.GET(new Request('https://shelvesofmash.com/sitemap.xml'));
const indexXml=await sitemapIndex.text();
for(const match of indexXml.matchAll(/<loc>(.*?)<\/loc>/g)) {
  const child=new URL(match[1]);
  assert.equal(child.pathname,'/sitemap.xml','Sitemap children must live at root scope');
  assert.ok(child.searchParams.has('page'));
}
let authRequests=0;
mocks['@supabase/ssr']={ createServerClient:()=>({auth:{getUser:async()=>{authRequests++;}}}) };
mocks['next/server']={ NextResponse:{next:()=>({cookies:{set(){}}})} };
const proxy=load('proxy').proxy;
await proxy({cookies:{getAll:()=>[]},headers:{}});
assert.equal(authRequests,0,'Anonymous traffic must not trigger remote session refresh');
await proxy({cookies:{getAll:()=>[{name:'sb-test-auth-token.0',value:'session'}]},headers:{}});
assert.equal(authRequests,1,'Existing chunked sessions still refresh');
console.log('PASS: anonymous proxy fast path and signed-in session refresh');
