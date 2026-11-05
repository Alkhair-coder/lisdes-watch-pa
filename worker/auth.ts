const enc=new TextEncoder();
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
async function key(secret:string){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
export async function digest(value:string){return hex(await crypto.subtle.digest('SHA-256',enc.encode(value)))}
export async function equalSecret(a:string,b:string){const x=await digest(a),y=await digest(b);let n=0;for(let i=0;i<x.length;i++)n|=x.charCodeAt(i)^y.charCodeAt(i);return n===0}
export async function issue(secret:string,now=Date.now()){const body=`${now+8*3600000}.${crypto.randomUUID()}`;return body+'.'+hex(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(body)))}
export async function verify(token:string,secret:string,now=Date.now()){const parts=token.split('.');if(parts.length!==3||!/^\d+$/.test(parts[0])||!Number.isFinite(+parts[0])||+parts[0]<=now||+parts[0]>now+8*3600000||!/^[a-f0-9]{64}$/.test(parts[2]))return false;const sig=Uint8Array.from(parts[2].match(/../g)!,x=>parseInt(x,16));return crypto.subtle.verify('HMAC',await key(secret),sig,enc.encode(parts[0]+'.'+parts[1]))}
