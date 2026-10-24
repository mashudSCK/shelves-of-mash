// Isolated PostgREST-shaped fixture for browser tests. Never contacts Supabase.
import http from 'node:http';
const shelf = { id:'40000000-0000-4000-8000-000000000001',slug:'philosophy',name:'Philosophy',description:'Ideas worth revisiting.',sort_order:1 };
const writings = Array.from({length:1205},(_,i)=>({
 id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,slug:`writing-${i+1}`,title:`TEST Writing ${i+1}`,
 subtitle:'An archive fixture.', content:'# Opening\n\nA fixture for reading.\n\n## More thoughts\n\nMore content.',
 shelf_id:shelf.id,shelf,status:'published',reading_time_minutes:2,is_featured:i<4,view_count:i,
 published_at:'2026-01-01T00:00:00.000Z',updated_at:'2026-01-01T00:00:00.000Z',cover_image_url:null,
 tags:[{tag:{id:'tag',slug:i%2 ? 'rare' : 'common',name:i%2 ? 'Rare' : 'Common'}}],
}));
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/health') {res.end('ok');return;}
 const table=url.pathname.split('/').at(-1);
 let rows=[];
 if(table==='get_shelf_counts') rows=[{shelf_id:shelf.id,writing_count:writings.length}];
 else if(table==='get_archive_years') rows=[{year:2026}];
 else if(table==='get_daily_writing_id') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(writings[0].id));return;}
 else if(table==='get_dashboard_stats') {res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'42501',message:'Administrator access required'}));return;}
 else if(table==='increment_writing_view') {res.statusCode=204;res.end();return;}
 else if(table==='writings') rows=writings;
 else if(table==='shelves') rows=[shelf];
 else if(table==='ai_summaries'||table==='bookmarks') rows=[];
 else if(url.pathname.startsWith('/auth/')) {res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({msg:'Not authenticated'}));return;}
 for(const [key,value] of url.searchParams){
   if(value.startsWith('eq.')){
     const expected=value.slice(3);
     if(key==='tags_filter.tag.slug') rows=rows.filter(w=>w.tags?.some(t=>t.tag.slug===expected));
     else if(key==='shelf_filter.slug') rows=rows.filter(w=>w.shelf?.slug===expected);
     else rows=rows.filter(row=>String(row[key])===expected);
   }else if(value.startsWith('neq.')) rows=rows.filter(row=>String(row[key])!==value.slice(4));
   else if(key==='search_vector') rows=rows.filter(w=>w.title.toLowerCase().includes(value.split('.').slice(1).join('.').toLowerCase()));
 }
 if(url.searchParams.has('order')){
  const orders=url.searchParams.get('order').split(',');
  rows=[...rows].sort((a,b)=>{for(const order of orders){const [key,direction]=order.split('.');const v=String(a[key]??'').localeCompare(String(b[key]??''));if(v)return direction==='desc'?-v:v;}return 0;});
 }
 const count=rows.length;
 const from=Number(url.searchParams.get('offset')??0);
 const limit=Number(url.searchParams.get('limit')??1000);
 rows=rows.slice(from,from+limit);
 res.setHeader('Content-Type','application/json');res.setHeader('Content-Range',`${from}-${from+rows.length-1}/${count}`);
 if(req.headers.accept?.includes('vnd.pgrst.object')){
  if(rows.length!==1){res.statusCode=406;res.end(JSON.stringify({code:'PGRST116',details:'0 rows',message:'No rows'}));return;}
  rows=rows[0];
 }
 res.end(req.method==='HEAD'?undefined:JSON.stringify(rows));
}).listen(4380,'127.0.0.1',()=>console.log('Supabase browser fixture listening on 4380'));
