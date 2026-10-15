const assert=require('node:assert/strict');
const vm=require('node:vm');
const {notificationWorkerSource}=require('./load-ts.cjs')('lib/notification-worker.ts');
const handlers={},state=new Map(),shown=[],closed=[],navigated=[];
// Asynchronous IndexedDB facade: the worker uses its real transaction boundaries.
const indexedDB={open(){const req={};setImmediate(()=>{req.result={close(){},transaction(){let pending=0;const tx={};const op=(fn)=>{pending++;const result={};setImmediate(()=>{result.result=fn();result.onsuccess?.();pending--;setImmediate(()=>{if(!pending)tx.oncomplete?.();});});return result;};tx.objectStore=()=>({get:key=>op(()=>state.get(key)),put:(value,key)=>op(()=>{state.set(key,value);return key;})});return tx;}};req.onsuccess();});return req;}};
let resolveResponse;
const self={Notification:{permission:'granted'},location:{origin:'https://life.test'},addEventListener:(type,fn)=>handlers[type]=fn,registration:{showNotification:async(title,options)=>shown.push({title,...options}),getNotifications:async()=>shown.map(n=>({data:n.data,close:()=>closed.push(n.tag)}))},clients:{matchAll:async()=>[{url:'https://life.test/dashboard',navigate:async url=>navigated.push(url),focus:async()=>{}}],openWindow:async url=>navigated.push(url)}};
vm.runInNewContext(notificationWorkerSource,{self,indexedDB,URL,Set,Date,fetch:async(url,options)=>{assert.equal(url,'/api/notifications/resolve');assert.equal(options.method,'POST');return resolveResponse;}});
const dispatch=async(type,event)=>{let pending;handlers[type]({...event,waitUntil:p=>pending=p});await pending;};
(async()=>{
 const now=Date.now(),item={id:'task:walk',category:'planner',title:'Morning Walk',body:'Your walk starts soon.',at:now-1000,expiresAt:now+60000,url:'/planner?item=walk&date=2026-10-15'};
 await dispatch('message',{data:{type:'NOTIFICATION_PREFERENCES',settings:{enabled:true,categories:{planner:true}},ids:[item.id]}});
 await dispatch('message',{data:{type:'SHOW_REMINDER',item}});assert.equal(shown.length,1);
 await dispatch('message',{data:{type:'SHOW_REMINDER',item}});assert.equal(shown.length,1,'duplicate suppressed across worker events');
 resolveResponse={ok:true,json:async()=>item};await dispatch('push',{data:{json:()=>({id:item.id,device:'test',token:'secret'})}});assert.equal(shown.length,1,'local and push deduplicate');
 await dispatch('message',{data:{type:'NOTIFICATION_PREFERENCES',settings:{enabled:true,categories:{planner:false}},ids:[]}});assert(closed.includes(item.id));
 await dispatch('message',{data:{type:'SHOW_REMINDER',item:{...item,id:'blocked'}}});assert.equal(shown.length,1);
 resolveResponse={ok:false};await dispatch('push',{data:{json:()=>({id:'deleted',device:'test',token:'secret'})}});assert.equal(shown.length,1,'deleted item fails resolution');
 await dispatch('message',{data:{type:'NOTIFICATION_PREFERENCES',settings:{enabled:true,categories:{planner:true}},ids:['valid']}});
 await dispatch('message',{data:{type:'SHOW_REMINDER',item:{...item,id:'stale'}}});assert.equal(shown.length,1,'local stale queued item invalidated');
 await dispatch('message',{data:{type:'SHOW_REMINDER',item:{...item,id:'valid',expiresAt:now-1000}}});assert.equal(shown.length,1,'expired reminder skipped');
 await dispatch('notificationclick',{notification:{data:{url:item.url},close(){}}});assert.equal(navigated[0],'https://life.test'+item.url);
 await dispatch('notificationclick',{notification:{data:{url:'https://evil.test'},close(){}}});assert.equal(navigated.length,1);
 self.Notification.permission='denied';resolveResponse={ok:true,json:async()=>({...item,id:'valid'})};await dispatch('push',{data:{json:()=>({})}});assert.equal(shown.length,1);
 console.log('PASS: worker delivery, cross-event local/push deduplication, category/deletion/expiry revalidation, queued-item cancellation, permission revocation and precise same-origin click routing.');
})().catch(e=>{console.error(e);process.exitCode=1;});
