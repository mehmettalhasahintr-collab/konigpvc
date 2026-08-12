import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {URL, fileURLToPath} from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url)), PUBLIC=path.join(ROOT,'public'), DATA=path.join(ROOT,'data','db.json'), UP=path.join(ROOT,'uploads');
const PORT=Number(process.env.PORT||3000); const SECRET=process.env.KONIG_SESSION_SECRET||'konig-local-secret-change-me';
fs.mkdirSync(UP,{recursive:true});
function load(){return JSON.parse(fs.readFileSync(DATA,'utf8'))} function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2))}
function hash(s){return crypto.createHash('sha256').update(s).digest('hex')}
function sign(v){return crypto.createHmac('sha256',SECRET).update(v).digest('hex')}
function cookie(v){return `konig_session=${v}.${sign(v)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`}
function auth(req){const c=req.headers.cookie||'';const m=c.match(/konig_session=([^.;]+)\.([^;]+)/);if(!m||m[2]!==sign(m[1]))return false;return m[1].startsWith('admin-')}
function json(res,obj,status=200){const b=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(b)}
function body(req){return new Promise((resolve,reject)=>{let a=[];req.on('data',c=>a.push(c));req.on('end',()=>resolve(Buffer.concat(a)));req.on('error',reject)})}
function mime(f){return {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.svg':'image/svg+xml'}[path.extname(f).toLowerCase()]||'application/octet-stream'}
function safeName(n){return path.basename(n).replace(/[^a-zA-Z0-9._-]/g,'_')}
function parseMultipart(buf,ct){const b=ct.match(/boundary=([^;]+)/)?.[1];if(!b)return {};const boundary=Buffer.from('--'+b);let out={};let pos=0;while((pos=buf.indexOf(boundary,pos))!==-1){pos+=boundary.length;if(buf.slice(pos,pos+2).toString()==='--')break;if(buf.slice(pos,pos+2).toString()==='\r\n')pos+=2;const end=buf.indexOf(boundary,pos);if(end<0)break;const part=buf.slice(pos,end-2);const sep=part.indexOf(Buffer.from('\r\n\r\n'));if(sep<0){pos=end;continue}const hs=part.slice(0,sep).toString();const data=part.slice(sep+4);const nm=hs.match(/name="([^"]+)"/);const fn=hs.match(/filename="([^"]*)"/);if(!nm){pos=end;continue}out[nm[1]]=fn?{filename:safeName(fn[1]),data}:data.toString('utf8');pos=end}return out}

async function notifyQuote(x,db){const to=process.env.NOTIFY_EMAIL||'export@derapvc.com.tr';const key=process.env.RESEND_API_KEY;if(!key){console.warn('RESEND_API_KEY tanımlı değil; talep database\'e kaydedildi fakat e-posta gönderilmedi.');return}const body=[`YENİ KÖNİG TALEBİ`,`Ad Soyad: ${x.name||'-'}`,`Firma: ${x.company||'-'}`,`Telefon: ${x.phone||'-'}`,`E-posta: ${x.email||'-'}`,`Proje türü: ${x.projectType||'-'}`,`Proje konumu: ${x.location||'-'}`,`Proje büyüklüğü: ${x.size||'-'}`,`Mesaj: ${x.message||'-'}`,`Dosya: ${x.file||'-'}`,`Tarih / saat: ${x.createdAt}`].join('\n');try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.NOTIFY_FROM||'KONİG <onboarding@resend.dev>',to:[to],subject:'YENİ KÖNİG TALEBİ',text:body})});if(!r.ok)console.error('E-posta gönderilemedi:',await r.text())}catch(e){console.error('E-posta hatası:',e.message)}}

const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,`http://${req.headers.host}`); const p=u.pathname; const db=load();
 if(p==='/api/health')return json(res,{ok:true});
 if(p==='/api/site')return json(res,{settings:db.settings,pages:db.pages,products:db.products.filter(x=>x.active),colors:db.colors,projects:db.projects.filter(x=>x.active),catalog:db.catalog});
 if(p==='/api/login'&&req.method==='POST'){const x=JSON.parse((await body(req)).toString()||'{}');if(x.username===db.admin.username&&hash(x.password||'')===db.admin.passwordHash){const sid='admin-'+crypto.randomBytes(18).toString('hex');res.writeHead(200,{'Set-Cookie':cookie(sid),'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true}))}return json(res,{error:'Kullanıcı adı veya şifre hatalı.'},401)}
 if(p==='/api/logout'&&req.method==='POST'){res.writeHead(200,{'Set-Cookie':'konig_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax','Content-Type':'application/json'});return res.end('{"ok":true}')} 
 if(p==='/api/quote'&&req.method==='POST'){const ct=req.headers['content-type']||'';let x={};if(ct.includes('multipart/form-data')){const fields=parseMultipart(await body(req),ct);for(const [k,v] of Object.entries(fields)){if(v&&v.data){const ext=path.extname(v.filename).toLowerCase();if(['.jpg','.jpeg','.png','.webp','.pdf'].includes(ext)){const name=Date.now()+'-'+v.filename;fs.writeFileSync(path.join(UP,name),v.data);x[k]='/uploads/'+name}else x[k]=v.filename}else x[k]=v}}else{x=JSON.parse((await body(req)).toString()||'{}')}x.id=crypto.randomUUID();x.createdAt=new Date().toISOString();x.status='new';db.submissions=db.submissions||[];db.submissions.push(x);save(db);await notifyQuote(x,db);return json(res,{ok:true,id:x.id},201)}
 if(p==='/api/admin/me')return json(res,{authenticated:auth(req)});
 if(p.startsWith('/api/admin/')){if(!auth(req))return json(res,{error:'Yetkisiz erişim.'},401);const parts=p.split('/').filter(Boolean);const resource=parts[2];const id=parts[3];
   if(req.method==='GET'){
    if(resource==='db')return json(res,db);
    if(resource==='products')return json(res,db.products);
    if(resource==='projects')return json(res,db.projects);
    if(resource==='submissions')return json(res,db.submissions||[]);
   }
   if(req.method==='PUT'&&resource==='settings'){Object.assign(db.settings,JSON.parse((await body(req)).toString()));save(db);return json(res,{ok:true,settings:db.settings})}
   if(req.method==='PUT'&&resource==='pages'){Object.assign(db.pages,JSON.parse((await body(req)).toString()));save(db);return json(res,{ok:true,pages:db.pages})}
   if(req.method==='PUT'&&resource==='products'&&id){const x=JSON.parse((await body(req)).toString());const i=db.products.findIndex(a=>a.id===id);if(i<0)return json(res,{error:'Ürün bulunamadı'},404);db.products[i]={...db.products[i],...x,id};save(db);return json(res,{ok:true,product:db.products[i]})}
   if(req.method==='POST'&&resource==='products'){const x=JSON.parse((await body(req)).toString());if(!x.id)x.id=crypto.randomUUID();x.active=x.active!==false;db.products.push(x);save(db);return json(res,{ok:true,product:x},201)}
   if(req.method==='DELETE'&&resource==='products'&&id){db.products=db.products.filter(x=>x.id!==id);save(db);return json(res,{ok:true})}
   if(req.method==='PUT'&&resource==='submissions'&&id){const x=JSON.parse((await body(req)).toString());const i=(db.submissions||[]).findIndex(a=>a.id===id);if(i<0)return json(res,{error:'Talep bulunamadı'},404);db.submissions[i]={...db.submissions[i],status:x.status||db.submissions[i].status};save(db);return json(res,{ok:true,submission:db.submissions[i]})}
   if(req.method==='POST'&&resource==='projects'){const x=JSON.parse((await body(req)).toString());x.id=x.id||crypto.randomUUID();x.createdAt=new Date().toISOString();db.projects.push(x);save(db);return json(res,{ok:true,project:x},201)}
   if(req.method==='PUT'&&resource==='projects'&&id){const x=JSON.parse((await body(req)).toString());const i=db.projects.findIndex(a=>a.id===id);if(i<0)return json(res,{error:'Proje bulunamadı'},404);db.projects[i]={...db.projects[i],...x,id};save(db);return json(res,{ok:true,project:db.projects[i]})}
   if(req.method==='DELETE'&&resource==='projects'&&id){db.projects=db.projects.filter(x=>x.id!==id);save(db);return json(res,{ok:true})}
   if(req.method==='PUT'&&resource==='colors'){db.colors=JSON.parse((await body(req)).toString());save(db);return json(res,{ok:true,colors:db.colors})}
   if(req.method==='PUT'&&resource==='catalog'){const x=JSON.parse((await body(req)).toString());db.catalog=x.catalog;save(db);return json(res,{ok:true,catalog:db.catalog})}
   if(req.method==='POST'&&resource==='password'){const x=JSON.parse((await body(req)).toString());if(!x.password||x.password.length<10)return json(res,{error:'Şifre en az 10 karakter olmalı.'},400);db.admin.passwordHash=hash(x.password);save(db);return json(res,{ok:true})}
   if(req.method==='POST'&&resource==='upload'){const b=await body(req);const fields=parseMultipart(b,req.headers['content-type']||'');const file=fields.file;if(!file||!file.filename)return json(res,{error:'Dosya bulunamadı'},400);const ext=path.extname(file.filename).toLowerCase();if(!['.jpg','.jpeg','.png','.webp','.pdf'].includes(ext))return json(res,{error:'Desteklenmeyen dosya.'},400);const name=Date.now()+'-'+file.filename;fs.writeFileSync(path.join(UP,name),file.data);return json(res,{ok:true,url:'/uploads/'+name})}
   if(req.method==='PUT'&&resource==='db'){const x=JSON.parse((await body(req)).toString());if(!x||typeof x!=='object'||Array.isArray(x))return json(res,{error:'Geçersiz veri.'},400);save(x);return json(res,{ok:true})}
   if(req.method==='GET'&&resource==='media'){const files=fs.readdirSync(UP).filter(f=>!f.startsWith('.')).map(name=>({name,url:'/uploads/'+name,size:fs.statSync(path.join(UP,name)).size}));return json(res,files)}
   if(req.method==='DELETE'&&resource==='media'&&id){const name=safeName(decodeURIComponent(id));const target=path.join(UP,name);if(!target.startsWith(UP)||!fs.existsSync(target))return json(res,{error:'Dosya bulunamadı'},404);fs.unlinkSync(target);return json(res,{ok:true})}
   return json(res,{error:'Admin endpoint bulunamadı'},404);
 }
 if(p.startsWith('/uploads/')){const f=path.join(UP,safeName(p.slice(9)));if(!f.startsWith(UP)||!fs.existsSync(f))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime(f)});return fs.createReadStream(f).pipe(res)}
 let f=path.normalize(path.join(PUBLIC,p==='/'?'index.html':p.slice(1)));if(!f.startsWith(PUBLIC)||!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(PUBLIC,'index.html');res.writeHead(200,{'Content-Type':mime(f)});fs.createReadStream(f).pipe(res);
 }catch(e){console.error(e);json(res,{error:'Sunucu hatası',detail:e.message},500)}});
server.listen(PORT,()=>console.log(`KÖNİG platform: http://localhost:${PORT}`));
