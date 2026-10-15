const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.LIFE_EDIT_URL || 'http://127.0.0.1:3016';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try {
  for(const width of [1280,390]) {
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.addInitScript(()=>{
    window.__notices=[];window.__permissionRequests=0;let permission='default';
    class FakeNotification {
     static get permission(){return permission;}
     static async requestPermission(){window.__permissionRequests++;permission='granted';return permission;}
     constructor(title,options){window.__notices.push({title,...options});}
     close(){}
    }
    Object.defineProperty(window,'Notification',{value:FakeNotification,configurable:true});
    if(navigator.serviceWorker) navigator.serviceWorker.getRegistration=async()=>undefined;
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const visit=async route=>{await page.goto(base+route);await page.locator('.le-loading').waitFor({state:'detached'});};
   await visit('/settings');
   assert.equal(await page.evaluate(()=>window.__permissionRequests),0,'no automatic permission prompt');
   const prefs=page.locator('.le-notification-preferences');
   assert.equal(await prefs.getByRole('checkbox').count(),10);
   await prefs.getByRole('button',{name:'Enable reminders'}).click();
   await page.waitForFunction(()=>window.__permissionRequests===1);
   await prefs.getByRole('checkbox',{name:'Journal reminders'}).check();
   await prefs.getByLabel('Journal time',{exact:true}).fill('21:00');
   await prefs.getByRole('checkbox',{name:'Life Reviews'}).check();
   await page.waitForTimeout(300);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('life-edit-demo-v1')));
   assert(saved.notificationSettings.categories.journal);assert.equal(saved.notificationSettings.reminderTimes.journalTime,'21:00');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   fs.mkdirSync('test-results/notifications',{recursive:true});
   await prefs.screenshot({path:`test-results/notifications/preferences-${width}.png`});
   const reset=saved.lifeResets.find(r=>r.status==='active'),completed=saved.lifeResets.find(r=>r.status==='completed');assert(reset&&completed);
   for(const item of [reset,completed]) {
    await visit('/life-reset?reset='+item.id);
    await page.getByRole('button',{name:'Delete Reset',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Delete this Reset?'});await dialog.waitFor();
    assert.match(await dialog.innerText(),/cannot be undone/);
    await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
    assert(await page.evaluate(id=>JSON.parse(localStorage.getItem('life-edit-demo-v1')).lifeResets.some(r=>r.id===id),item.id));
    await page.getByRole('button',{name:'Delete Reset',exact:true}).click();
    if(item===reset)await dialog.screenshot({path:`test-results/notifications/delete-${width}.png`});
    await dialog.getByRole('button',{name:'Delete Reset',exact:true}).click();
    await page.waitForFunction(id=>!JSON.parse(localStorage.getItem('life-edit-demo-v1')).lifeResets.some(r=>r.id===id),item.id);
    assert.equal(await page.getByRole('button',{name:'Undo delete',exact:true}).count(),0);
    await page.reload();await page.locator('.le-loading').waitFor({state:'detached'});
    assert(!await page.evaluate(id=>JSON.parse(localStorage.getItem('life-edit-demo-v1')).lifeResets.some(r=>r.id===id),item.id));
   }
   await visit('/planner?item='+saved.tasks[0].id+'&date='+saved.tasks[0].date);
   await page.getByRole('dialog').waitFor();assert.equal(await page.getByLabel('Title',{exact:true}).inputValue(),saved.tasks[0].title);
   await visit('/life-edit?goal='+saved.goals[0].id);await page.getByRole('dialog').waitFor();
   assert((await page.getByRole('dialog').innerText()).includes('Save'));
   await visit('/finance?item='+saved.transactions[0].id);await page.getByRole('dialog').waitFor();
   await visit('/insights?review=new');await page.getByRole('dialog',{name:'Life balance review'}).waitFor();
   await visit('/settings');
   await page.evaluate(()=>{
    const data=JSON.parse(localStorage.getItem('life-edit-demo-v1'));
    data.focusPlan={id:'background-test',name:'Quiet study',focusMinutes:1,breakMinutes:0,sessions:1,completed:0,phase:'focus',running:true,endsAt:Date.now()+4000,remaining:4};
    data.notificationSettings.enabled=true;data.notificationSettings.categories.focus=true;
    localStorage.setItem('life-edit-demo-v1',JSON.stringify(data));
   });
   // Grant the fake device permission in this newly loaded page, then navigate
   // within the app so the global provider and reminder manager remain alive.
   await page.reload();await page.locator('.le-loading').waitFor({state:'detached'});
   await page.evaluate(()=>Notification.requestPermission());
   await page.waitForFunction(()=>window.__notices.some(n=>n.title==='Focus plan complete'),null,{timeout:15000});
   assert.equal(await page.evaluate(()=>window.__notices.filter(n=>n.title==='Focus plan complete').length),1);
   await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>window.__notices.filter(n=>n.title==='Focus plan complete').length),1);
   await page.evaluate(()=>{
    const data=JSON.parse(localStorage.getItem('life-edit-demo-v1'));
    data.focusPlan={id:'cancelled-plan',name:'Cancelled focus',focusMinutes:1,breakMinutes:1,sessions:2,completed:0,phase:'focus',running:true,endsAt:Date.now()+4000,remaining:4};
    localStorage.setItem('life-edit-demo-v1',JSON.stringify(data));
   });
   await visit('/focus');await page.evaluate(()=>Notification.requestPermission());
   await page.getByRole('button',{name:'Reset plan',exact:true}).click();
   await page.waitForTimeout(5500);
   assert.equal(await page.evaluate(()=>window.__notices.filter(n=>n.category==='focus'||n.body?.includes('Cancelled focus')).length),0);
   await context.close();
  }
  assert.deepEqual(errors,[]);
  const worker=await (await fetch(base+'/sw.js')).text();assert(worker.includes("addEventListener('push'"));assert(worker.includes('notificationclick'));
  assert.equal((await fetch(base+'/api/notifications/deliver')).status,401);
  assert.equal((await fetch(base+'/api/notifications/subscription')).status,200);
  console.log('PASS: desktop/mobile confirmation and persistent full Reset deletion, no undo, category/time persistence, no automatic prompts, task/goal/payment/review deep links, global focus completion once, worker route and job authentication.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
