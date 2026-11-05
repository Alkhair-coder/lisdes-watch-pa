import {dataSchema,defaults} from '../lib/model.ts';
import {issue,verify,equalSecret,digest} from './auth.ts';
interface Env {DB:D1Database;ASSETS:Fetcher;ADMIN_KEY?:string}
const json=(v:unknown,status=200,extra:Record<string,string>={})=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const cookie=(token:string,req:Request,age=28800)=>`lisdes_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
export async function handler(req:Request,env:Env):Promise<Response>{const url=new URL(req.url),path=url.pathname;if(!path.startsWith('/api/'))return env.ASSETS.fetch(req);
if(!['GET','POST','PUT'].includes(req.method))return json({error:'Metode tidak diizinkan'},405);
if(req.method!=='GET'&&req.headers.get('origin')!==url.origin)return json({error:'Origin tidak diizinkan'},403);
const secret=env.ADMIN_KEY;
const token=(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('lisdes_admin='))?.slice(13)||'';
const admin=!!secret&&secret.length>=32&&await verify(token,secret);
if(path==='/api/login'&&req.method==='POST'){
if(!secret||secret.length<32)return json({error:'Admin belum dikonfigurasi. Tetapkan ADMIN_KEY minimal 32 karakter melalui Wrangler.'},503);
const raw=await req.text();if(raw.length>1024)return json({error:'Permintaan terlalu besar'},413);
let body;try{body=JSON.parse(raw)}catch{return json({error:'Input tidak valid'},400)}
const now=Date.now(),window=Math.floor(now/900000),ip=await digest(req.headers.get('CF-Connecting-IP')||'local');
// Atomic per-IP window counter. One row per current IP hash, with stale rows pruned.
await env.DB.prepare('DELETE FROM login_limits WHERE window < ?').bind(window-1).run();
const limit=await env.DB.prepare('INSERT INTO login_limits (key, window, attempts) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN window = excluded.window THEN attempts + 1 ELSE 1 END, window = excluded.window RETURNING attempts').bind(ip,window).first<{attempts:number}>();
if(!limit||limit.attempts>5)return json({error:'Terlalu banyak percobaan. Coba lagi setelah 15 menit.'},429);
if(typeof body.password!=='string'||!await equalSecret(body.password,secret))return json({error:'Kunci admin tidak sesuai.'},401);
return json({ok:true},200,{'Set-Cookie':cookie(await issue(secret),req)});
}
if(path==='/api/logout'&&req.method==='POST')return json({ok:true},200,{'Set-Cookie':cookie('',req,0)});
if(path!=='/api/data')return json({error:'Tidak ditemukan'},404);
if(req.method==='GET'){
if(!admin)return json({projects:[],settings:defaults,revision:0,updatedAt:null,authenticated:false});
const row=await env.DB.prepare('SELECT payload, revision, updated_at FROM dashboard WHERE owner = ?').bind('admin').first<{payload:string;revision:number;updated_at:string}>();
return json(row?{...JSON.parse(row.payload),revision:row.revision,updatedAt:row.updated_at,authenticated:true}:{projects:[],settings:defaults,revision:0,updatedAt:null,authenticated:true});}
if(req.method!=='PUT')return json({error:'Metode tidak diizinkan'},405);
if(!admin)return json({error:'Masuk sebagai admin untuk menyimpan data.'},401);
const raw=await req.text();if(raw.length>2000000)return json({error:'Data terlalu besar'},413);
let body;try{body=JSON.parse(raw)}catch{return json({error:'Input tidak valid'},400)}
const parsed=dataSchema.safeParse(body);if(!parsed.success)return json({error:parsed.error.issues.map(i=>i.message).join('; ')},400);
if(!Number.isInteger(body.revision)||body.revision<0)return json({error:'Revisi tidak valid'},400);
const updatedAt=new Date().toISOString(),payload=JSON.stringify(parsed.data);
const row=body.revision===0?await env.DB.prepare('INSERT INTO dashboard (owner,payload,revision,updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(owner) DO NOTHING RETURNING revision').bind('admin',payload,updatedAt).first():await env.DB.prepare('UPDATE dashboard SET payload = ?, revision = revision + 1, updated_at = ? WHERE owner = ? AND revision = ? RETURNING revision').bind(payload,updatedAt,'admin',body.revision).first();
if(!row)return json({error:'Data berubah di sesi lain. Muat ulang sebelum menyimpan.'},409);
return json({revision:body.revision+1,updatedAt});}
export default {async fetch(req:Request,env:Env){try{return await handler(req,env)}catch{return json({error:'Layanan belum siap atau batas penggunaan tercapai. Coba lagi; data lama tetap tersimpan.'},503)}}};
