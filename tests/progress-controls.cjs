const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.LIFE_EDIT_URL||'http://localhost:3004';
 const visit=async path=>{await page.goto(base+path);await page.locator('.le-content').waitFor();};
 const click=async name=>page.getByRole('button',{name,exact:true}).first().click();
 const fill=async(name,value)=>page.getByLabel(name,{exact:true}).fill(String(value));
 fs.mkdirSync('test-results',{recursive:true});
 try {
  await visit('/fitness');await click('Add entry to Weight trend');await fill('Progress date','2026-09-01');await fill('Body weight (kg)',70);await fill('Waist (cm)',80);await fill('Chest (cm)',90);await click('Save progress entry');
  await click('Weight trend, 2026-09-01: 70 kg');await page.getByRole('status').filter({hasText:'2026-09-01: 70 kg'}).waitFor();
  await page.getByLabel('Measurement trend',{exact:true}).selectOption('chest');await page.getByRole('button',{name:'Chest measurements, 2026-09-01: 90 cm',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('status').filter({hasText:'2026-09-01: 90 cm'}).waitFor();
  await page.getByLabel('Measurement trend',{exact:true}).selectOption('hips');await page.locator('.le-empty-mark').first().click();await page.getByRole('dialog',{name:'Create progress entry'}).waitFor();await click('Close dialog');
  await fill('Fitness month','2026-09');await click('2026-09-01: 0 workouts');await page.getByText('2026-09-01: No workouts recorded',{exact:true}).waitFor();
  await click('Edit 2026-09-01');await fill('Body weight (kg)',71);await click('Save progress entry');await click('Weight trend, 2026-09-01: 71 kg');await click('Delete 2026-09-01');await click('Undo delete');
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({animations:'disabled',path:'test-results/progress-controls-desktop.png',fullPage:true});
  await visit('/planner');await click('Add time block');await fill('Title','Deep work');await fill('Duration hours',2);await fill('Duration minutes',15);await click('Save time block');await page.getByRole('button',{name:/2h 15m.*Deep work/}).click();assert.equal(await page.getByLabel('Duration hours',{exact:true}).inputValue(),'2');assert.equal(await page.getByLabel('Duration minutes',{exact:true}).inputValue(),'15');
  await fill('Duration hours',0);await fill('Duration minutes',0);await click('Save time block');assert.equal(await page.getByRole('dialog').count(),1);await fill('Duration hours',24);await fill('Duration minutes',1);await click('Save time block');assert.equal(await page.getByRole('dialog').count(),1);await fill('Duration hours',1);await fill('Duration minutes',30);await click('Save time block');await page.reload();await page.getByRole('button',{name:/1h 30m.*Deep work/}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:/1h 30m.*Deep work/}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({animations:'disabled',path:'test-results/planner-duration-mobile.png'});await click('Close dialog');await visit('/fitness');await click('Weight trend, 2026-09-01: 71 kg');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  console.log('PASS: trend add controls, pointer/keyboard point selection, dropdown, calendar, progress CRUD/undo, hour/minute validation, persistence and mobile layouts.');
 }catch(e){await page.screenshot({animations:'disabled',path:'test-results/progress-controls-failure.png',fullPage:true});console.error(await page.locator('body').innerText());throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
