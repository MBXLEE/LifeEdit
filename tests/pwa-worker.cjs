const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const vm=require('node:vm');
const mod=new Module(__filename,module);
mod._compile(ts.transpileModule(fs.readFileSync('lib/pwa-worker.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,__filename);
async function harness(mode,header,offline=false,development=false) {
  const handlers={},saved=[],deleted=[];let unregistered=false;
  const cache={addAll:async()=>{},put:async(key)=>saved.push(key),match:async(key)=>key==='/offline.html'?new Response('offline'):undefined};
  const self={location:{origin:'https://life.test'},registration:{unregister:async()=>{unregistered=true;}},clients:{claim:async()=>{}},addEventListener:(key,fn)=>handlers[key]=fn};
  vm.runInNewContext(`const MODE=${JSON.stringify(mode)};const VERSION='test';const DEVELOPMENT=${development};${mod.exports.workerSource}`,{self,URL,Set,Response,caches:{open:async()=>cache,keys:async()=>['unrelated-cache','lifeedit-pwa-v1'],delete:async(key)=>deleted.push(key)},fetch:async()=>{if(offline)throw Error('offline');return new Response('document',{headers:header?{'X-Life-Edit-Mode':header}:{}});}});
  let pending;handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['lifeedit-pwa-v1']);
  const request={url:'https://life.test/dashboard',method:'GET',mode:'navigate'};
  let intercepted=false;handlers.fetch({request,respondWith:p=>{intercepted=true;pending=p;}});
  if(development){assert.equal(unregistered,true);assert.equal(intercepted,false);return;}
  const result=await pending;
  assert.equal(saved.length,mode==='DEMO'&&header==='DEMO'&&!offline?1:0);
  if(offline)assert.equal(await result.text(),'offline');
  intercepted=false;handlers.fetch({request:{url:'https://backend.supabase.co/rest/v1/data',method:'GET',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
  handlers.fetch({request:{url:'https://life.test/api/private',method:'GET',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
}
(async()=>{await harness('DEMO','DEMO');await harness('DEMO',null);await harness('PRODUCTION','DEMO');await harness('DEMO','DEMO',true);await harness('DEMO','DEMO',false,true);console.log('PASS: demo-only server-approved document caching, no production/API/backend caching, dev cleanup, scoped cache cleanup and offline fallback.');})().catch(error=>{console.error(error);process.exitCode=1;});
