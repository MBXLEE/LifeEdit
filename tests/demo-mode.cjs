const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel:'msedge',headless:true });
  const context = await browser.newContext({ viewport:{width:390,height:844} });
  const page = await context.newPage();
  const base = process.env.LIFE_EDIT_URL || 'http://localhost:3004';
  const errors = [], backend = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => { if (/supabase/.test(request.url())) backend.push(request.url()); });
  const visit = async route => { await page.goto(base + route); await page.locator('.le-content').waitFor(); };
  const saved = key => page.evaluate(key => JSON.parse(localStorage.getItem(key || 'life-edit-demo-v1')), key);
  try {
    await visit('/dashboard');
    let data = await saved();
    fs.mkdirSync('test-results/demo',{recursive:true});
    await page.screenshot({path:'test-results/demo/dashboard.png',animations:'disabled'});
    assert.equal(data.name,'Demo User');assert.equal(data.theme,'Ocean');assert.equal(data.onboarded,true);
    for (const key of ['tasks','habits','journals','goals','transactions','budgets','workouts','relationships','reviews']) assert.ok(data[key].length, key);
    assert.equal(Object.keys(data.assessment).length,6);
    await page.getByLabel('Dismiss demo notice').click();await page.reload();
    assert.equal(await page.getByLabel('Demo mode notice').count(),0);
    for (const route of ['/planner','/focus','/journal','/life-edit','/finance','/fitness','/social','/insights','/onboarding']) { await visit(route); assert.match(page.url(),new RegExp(route+'$')); }
    await visit('/settings');await page.getByLabel('Display name',{exact:true}).fill('Demo Tester');await page.waitForTimeout(500);await page.reload();assert.equal(await page.getByLabel('Display name',{exact:true}).inputValue(),'Demo Tester');
    await page.goto(base+'/login');await page.getByRole('button',{name:'Continue As Guest',exact:true}).click();await page.waitForURL('**/dashboard');await page.locator('.le-content').waitFor();
    data = await saved('life-edit-guest-v1');assert.equal(data.name,'Guest');assert.equal(data.tasks.length,0);assert.equal(data.onboarded,false);
    await visit('/settings');await page.getByLabel('Display name',{exact:true}).fill('Guest Tester');await page.waitForTimeout(500);
    await page.goto(base+'/login');await page.getByRole('button',{name:'Demo User Login',exact:true}).click();await page.waitForURL('**/dashboard');await page.locator('.le-content').waitFor();assert.equal((await saved()).name,'Demo Tester');assert.equal((await saved('life-edit-guest-v1')).name,'Guest Tester');
    const other = await page.context().newPage();
    await other.goto(base+'/login');await other.getByRole('button',{name:'Continue As Guest',exact:true}).click();await other.waitForURL('**/dashboard');await other.locator('.le-content').waitFor();
    await page.getByLabel('Open profile settings').click();await page.getByLabel('Display name',{exact:true}).fill('Demo in first tab');await page.waitForTimeout(500);
    assert.equal((await saved()).name,'Demo in first tab');assert.equal((await saved('life-edit-guest-v1')).name,'Guest Tester');
    await other.close();
    await page.evaluate(async()=>{localStorage.setItem('unrelated-app-data','keep');await new Promise((resolve,reject)=>{const r=indexedDB.open('life-edit-images',1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const t=db.transaction('images','readwrite');t.objectStore('images').put(new Blob(['test']),'reset-image');t.oncomplete=()=>{db.close();resolve();};};});});
    await visit('/settings');await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.ok((await saved()).tasks.length);
    await page.getByRole('button',{name:'Reset Demo Data',exact:true}).click();await page.getByRole('button',{name:'Reset and restart onboarding',exact:true}).click();await page.waitForURL('**/onboarding');await page.locator('.le-content').waitFor();
    data=await saved();assert.equal(data.onboarded,false);assert.equal(data.name,'Demo User');assert.equal(data.tasks.length,0);assert.equal(data.focusPlan,null);assert.equal(await saved('life-edit-guest-v1'),null);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-app-data')),'keep');
    assert.equal(await page.evaluate(async()=> (await indexedDB.databases()).some(db=>db.name==='life-edit-images')),false);
    await page.reload();await page.locator('.le-content').waitFor();assert.equal((await saved()).tasks.length,0);assert.equal((await saved()).onboarded,false);
    fs.mkdirSync('test-results/demo',{recursive:true});await page.screenshot({path:'test-results/demo/reset-onboarding.png',animations:'disabled'});
    assert.deepEqual(backend,[]);assert.deepEqual(errors,[]);
    console.log('PASS: no-auth routes, seeded profile/entities, no Supabase requests, separate guest persistence, banner dismissal, reset/cancel, media cleanup, onboarding restart and no reseeding.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
