const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),path=require('node:path'),ts=require('typescript');
const load=require('./load-ts.cjs'),notifications=load('lib/notifications.ts'),{dateInZone}=load('lib/notification-time.ts');
const now=Date.now(),zone='UTC',day=dateInZone(now,zone),time=new Date(now).toISOString().slice(11,16);
const workspace={notificationSettings:{...notifications.defaultNotificationSettings(),enabled:true},tasks:[{id:'walk',title:'Morning Walk',date:day,time,done:false,kind:'time-block'}],lifeResets:[],focusPlan:null};workspace.notificationSettings.reminderTimes.plannerLeadMinutes=0;
const device={id:'device-1',user_id:'user-1',delivery_token:'secret',time_zone:zone,subscription:{endpoint:'https://push.test'}};
const claims=new Map();let devices=[device],sendFailure=null,pushes=0,reads=0;
class Query{
 constructor(table){this.table=table;this.filters=[];this.action='select';}
 select(){return this;}eq(k,v){this.filters.push(row=>row[k]===v);return this;}gt(k,v){this.filters.push(row=>row[k]>v);return this;}lt(){return this;}order(){return this;}limit(){return this;}
 update(patch){this.action='update';this.patch=patch;return this;}delete(){this.action='delete';return this;}
 maybeSingle(){return this.execute(true);}then(a,b){return this.execute(false).then(a,b);}
 async execute(single){
  if(this.table==='life_workspaces'){reads++;return {data:{data:workspace},error:null};}
  if(this.table==='notification_deliveries')return {data:single?{notification_id:'walk'}:[],error:null};
  const selected=devices.filter(row=>this.filters.every(filter=>filter(row)));
  if(this.action==='delete')devices=devices.filter(row=>!selected.includes(row));
  if(this.action==='update')selected.forEach(row=>Object.assign(row,this.patch));
  return {data:single?selected[0]??null:selected,error:null};
 }
}
const db={from:table=>new Query(table),rpc:async(name,args)=>{assert.equal(name,'claim_notification');const key=args.device+args.notification;if(claims.has(key))return {data:false};claims.set(key,true);return {data:true};}};
function route(file,mocks){const filename=path.resolve(file),mod=new Module(filename,module);mod.require=name=>name in mocks?mocks[name]:require(name);mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);return mod.exports;}
const server={pushConfigured:()=>true,notificationAdmin:()=>db};
const deliver=route('app/api/notifications/deliver/route.ts',{'@/lib/notification-server':server,'@/lib/notifications':notifications,'web-push':{setVapidDetails(){},async sendNotification(subscription,payload,options){pushes++;assert.equal(JSON.parse(payload).token,'secret');assert.equal(options.TTL,60);if(sendFailure)throw sendFailure;}}});
const resolve=route('app/api/notifications/resolve/route.ts',{'@/lib/notification-server':server,'@/lib/notifications':notifications});
const job=()=>new Request('https://life.test/api/notifications/deliver',{headers:{authorization:'Bearer test-secret'}});
(async()=>{
 process.env.CRON_SECRET='test-secret';
 assert.equal((await deliver.GET(new Request('https://life.test/api/notifications/deliver'))).status,401);
 devices[0].enabled=true;
 assert.equal((await deliver.GET(job())).status,200);assert.equal(pushes,1);assert(reads>0);
 await deliver.GET(job());assert.equal(pushes,1,'overlapping or repeated jobs cannot resend');
 const id=notifications.buildNotificationSchedule(workspace,Date.now(),zone).find(n=>n.category==='planner').id;
 const resolution=()=>new Request('https://life.test/api/notifications/resolve',{method:'POST',body:JSON.stringify({id,device:device.id,token:'secret'})});
 assert.equal((await resolve.POST(resolution())).status,200);
 workspace.tasks[0].done=true;assert.equal((await resolve.POST(resolution())).status,404,'completion after push send invalidates delivery');
 workspace.tasks[0].done=false;workspace.tasks=[];assert.equal((await resolve.POST(resolution())).status,404,'deletion after push send invalidates delivery');
 workspace.notificationSettings.enabled=false;assert.equal((await resolve.POST(resolution())).status,404);
 workspace.notificationSettings.enabled=true;workspace.tasks=[{id:'another',title:'A second plan',date:day,time,done:false,kind:'time-block'}];
 sendFailure={statusCode:410};await deliver.GET(job());assert.equal(devices.length,0,'expired endpoints are removed');
 console.log('PASS: authenticated cron dispatch, latest-workspace reads, repeat-job claims, completion/deletion/category invalidation after push send, and expired endpoint cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
