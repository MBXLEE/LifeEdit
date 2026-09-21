const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const source = ts.transpileModule(fs.readFileSync('middleware.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function check(demo, configured, authenticated) {
  let calls=0;
  const mod=new Module(__filename,module);
  mod.require=name=> {
    if(name==='./lib/app-mode')return {isDemoMode:demo};
    if(name==='next/server')return {NextResponse:{next:()=>({kind:'next',headers:{set(){}},cookies:{set(){}}}),redirect:url=>({kind:'redirect',path:url.pathname})}};
    if(name==='@supabase/ssr')return {createServerClient:()=>{calls++;return {auth:{getUser:async()=>({data:{user:authenticated?{id:'test'}:null}})}};}};
    throw new Error(name);
  };
  mod._compile(source,__filename);
  const originalUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,originalKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    if(configured){process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.test';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='key';}
    else {delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;}
    const response=await mod.exports.middleware({nextUrl:{pathname:'/dashboard',clone:()=>new URL('http://localhost/dashboard')},cookies:{getAll:()=>[]}});
    assert.equal(response.kind,demo||authenticated&&configured?'next':'redirect');
    if(response.kind==='redirect')assert.equal(response.path,'/login');
    assert.equal(calls,!demo&&configured?1:0);
  } finally {
    if(originalUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=originalUrl;
    if(originalKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=originalKey;
  }
}
(async()=>{for(const [demo,configured,user] of [[true,false,false],[true,true,false],[false,false,false],[false,true,false],[false,true,true]])await check(demo,configured,user);console.log('PASS: demo bypass without backend calls; production missing configuration and unauthenticated access denied; authenticated access allowed.');})().catch(error=>{console.error(error);process.exitCode=1;});
