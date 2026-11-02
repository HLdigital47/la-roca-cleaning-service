// Cloudflare Pages Function — La Roca lead intake.
// Set APPS_SCRIPT_URL (text) and LA_ROCA_FORM_SECRET (encrypted secret)
// in Cloudflare Pages > Settings > Variables and secrets.
// This function never exposes either value to the browser.
const allowedOrigin='https://larocacleaningservices.com';
const out=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequestPost({request,env}){
  if(!env.APPS_SCRIPT_URL||!env.LA_ROCA_FORM_SECRET)return out({ok:false,error:'not_configured'},503);
  const origin=request.headers.get('Origin');
  if(origin && origin!==allowedOrigin)return out({ok:false,error:'origin'},403);
  const type=request.headers.get('Content-Type')||'';
  if(!type.includes('application/json'))return out({ok:false,error:'content_type'},415);
  const size=Number(request.headers.get('Content-Length')||0);
  if(size>12000)return out({ok:false,error:'too_large'},413);
  let data;
  try{data=await request.json()}catch{return out({ok:false,error:'invalid_json'},400)}
  if(!data||typeof data!=='object'||Array.isArray(data))return out({ok:false,error:'invalid_body'},400);
  if(data.website)return out({ok:true},200); // honeypot field
  const clean=(key,n)=>String(data[key]??'').trim().slice(0,n);
  const payload={name:clean('name',120),phone:clean('phone',50),email:clean('email',180),service:clean('service',180),area:clean('area',90),message:clean('message',1800),page:clean('page',400),token:env.LA_ROCA_FORM_SECRET};
  if(!payload.name||!payload.phone||!payload.area||!payload.service)return out({ok:false,error:'missing_fields'},400);
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.APPS_SCRIPT_URL))return out({ok:false,error:'bad_config'},503);
  try{
    const response=await fetch(env.APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(25000)});
    if(!response.ok)return out({ok:false,error:'upstream'},502);
    const text=await response.text();
    let result;try{result=JSON.parse(text)}catch{return out({ok:false,error:'invalid_upstream'},502)}
    if(result.ok!==true)return out({ok:false,error:'upstream_rejected'},502);
    return out({ok:true});
  }catch(error){return out({ok:false,error:'network'},502)}
}
export function onRequestGet(){return out({ok:false,error:'method_not_allowed'},405)}
