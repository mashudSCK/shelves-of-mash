// Isolated, stateful Supabase fixture. Never contacts a real backend.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
const shelf={id:'40000000-0000-4000-8000-000000000001',slug:'philosophy',name:'Philosophy',description:'Ideas worth revisiting.',sort_order:1};
const initial=()=>Array.from({length:1205},(_,i)=>({id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,slug:`writing-${i+1}`,title:`TEST Writing ${i+1}`,subtitle:'An archive fixture.',content:i===0?'# Opening\n\n'+Array.from({length:48},(_,n)=>`## Passage ${n+1}\n\n`+('A thoughtful passage about memory, place, and the stories we return to. '.repeat(12))).join('\n\n'):'# Opening\n\nA fixture for reading.\n\n## More thoughts\n\nMore content.',shelf_id:shelf.id,shelf,status:'published',reading_time_minutes:2,is_featured:i<4,view_count:i,published_at:'2026-01-01T00:00:00.000Z',updated_at:'2026-01-01T00:00:00.000Z',cover_image_url:null,tags:[{tag:{id:'tag',slug:i%2?'rare':'common',name:i%2?'Rare':'Common'}}]}));
let tables,failCron=false,failArchive=false,uploads=[];
function reset(){tables={writings:initial(),shelves:[shelf],tags:[],writing_tags:[],operational_events:[],bookmarks:[],ai_summaries:[]};uploads=[];failCron=false;}
reset();
const user=role=>({id:role==='admin'?'20000000-0000-4000-8000-000000000002':'20000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:`${role}@fixture.invalid`,app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-01-01T00:00:00Z'});
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const send=(body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(req.method==='HEAD'?undefined:JSON.stringify(body));};
 if(url.pathname==='/health'){res.end('ok');return;}
 if(req.method==='GET'&&url.pathname.startsWith('/storage/v1/object/public/writing-covers/')){
  res.writeHead(200,{'Content-Type':'image/png'});
  res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=','base64'));return;
 }
 let raw='';for await(const chunk of req)raw+=chunk;
 let body;try{body=JSON.parse(raw||'{}');}catch{body={};}
 if(url.pathname==='/__fixture/reset'){reset();send({ok:true});return;}
 if(url.pathname==='/__fixture/state'){send({writings:tables.writings.filter(w=>w.slug.startsWith('workflow-')),events:tables.operational_events,uploads});return;}
 if(url.pathname==='/__fixture/fail-cron'){failCron=true;send({ok:true});return;}
 if(url.pathname==='/__fixture/fail-archive'){failArchive=true;send({ok:true});return;}
 if(url.pathname==='/__fixture/due'){tables.writings.filter(w=>w.status==='scheduled').forEach(w=>w.scheduled_for='2000-01-01T00:00:00Z');send({ok:true});return;}
 const token=req.headers.authorization?.replace('Bearer ','');
 let role;try{role=JSON.parse(Buffer.from(token.split('.')[1],'base64url')).fixture_role;}catch{}
 const service=token==='test-service-key';
 if(url.pathname.startsWith('/auth/')){if(role)send(user(role));else send({msg:'Not authenticated'},401);return;}
 if(url.pathname.startsWith('/storage/')){if(role!=='admin'&&!service){send({message:'Forbidden'},403);return;}uploads.push(url.pathname);send({Key:url.pathname,Id:randomUUID()});return;}
 const table=url.pathname.split('/').at(-1);
 if(table==='profiles'){const profile={...user(role||'reader'),role:role||'reader',display_name:role||'Reader'};send(req.headers.accept?.includes('vnd.pgrst.object')?profile:[profile]);return;}
 let rows=tables[table]??[];
 if(table==='writings'&&role!=='admin'&&!service) rows=rows.filter(row=>row.status==='published');
 if(table==='search_published_writings') {
  const query=String(body.query_text??'').trim().toLowerCase();
  const matches=tables.writings.filter(w=>w.status==='published'&&w.title.toLowerCase().includes(query));
  const offset=(Math.max(1,Number(body.page_number)||1)-1)*12;
  send({total:matches.length,writings:matches.slice(offset,offset+12).map(w=>({...w,tags:w.tags.map(t=>t.tag),excerpt:'<script>fixture excerpt</script>'}))});return;
 }
 if(table==='get_shelf_counts')rows=[{shelf_id:shelf.id,writing_count:tables.writings.filter(w=>w.status==='published').length}];
 if(table==='get_archive_years')rows=[{year:2026}];
 if(table==='get_daily_writing_id'){send(tables.writings[0].id);return;}
 if(table==='get_dashboard_stats'){if(role!=='admin'){send({code:'42501',message:'Administrator access required'},403);return;}send({totalWritings:tables.writings.length,totalViews:0,publishedCount:1205,draftCount:0,scheduledCount:0,mostViewed:[],mostBookmarked:[]});return;}
 if(table==='increment_writing_view'){res.statusCode=204;res.end();return;}
 const matches=row=>[...url.searchParams].every(([key,value])=>{
  if(value.startsWith('eq.')){const expected=value.slice(3);if(key==='tags_filter.tag.slug')return row.tags?.some(t=>t.tag.slug===expected);if(key==='shelf_filter.slug')return row.shelf?.slug===expected;return String(row[key])===expected;}
  if(value.startsWith('neq.'))return String(row[key])!==value.slice(4);
  if(value.startsWith('lte.'))return row[key]&&row[key]<=value.slice(4);
  if(key==='search_vector')return row.title.toLowerCase().includes(value.split('.').slice(1).join('.').toLowerCase());return true;
 });
 if(table==='operational_events'&&!service&&role!=='admin'){send([]);return;}
 if(['POST','PATCH','DELETE'].includes(req.method)&&tables[table]){
  if(table==='writings'&&req.method==='PATCH'&&body.status==='archived'&&failArchive){failArchive=false;send({message:'Injected archive failure'},500);return;}
  if(!service&&role!=='admin'){send({message:'Forbidden'},403);return;}
  if(table==='writings'&&service&&failCron){failCron=false;send({message:'Injected failure'},500);return;}
  if(req.method==='POST'){rows=(Array.isArray(body)?body:[body]).map(v=>({id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),tags:[],shelf,...v}));tables[table].push(...rows);}
  if(req.method==='PATCH'){rows=rows.filter(matches);rows.forEach(row=>Object.assign(row,body));}
  if(req.method==='DELETE'){rows=rows.filter(matches);tables[table]=tables[table].filter(row=>!rows.includes(row));}
 }else rows=rows.filter(matches);
 if(url.searchParams.has('order')){const orders=url.searchParams.get('order').split(',');rows=[...rows].sort((a,b)=>{for(const order of orders){const[key,direction]=order.split('.');const v=String(a[key]??'').localeCompare(String(b[key]??''));if(v)return direction==='desc'?-v:v;}return 0;});}
 const count=rows.length,from=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??1000);rows=rows.slice(from,from+limit);
 res.setHeader('Content-Range',`${from}-${from+rows.length-1}/${count}`);
 if(req.headers.accept?.includes('vnd.pgrst.object')){if(rows.length!==1){send({code:'PGRST116',details:'0 rows',message:'No rows'},406);return;}rows=rows[0];}
 send(rows);
}).listen(4380,'127.0.0.1',()=>console.log('Supabase browser fixture listening on 4380'));

