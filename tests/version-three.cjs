const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(25000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.LIFE_EDIT_URL||'http://localhost:3003';
  const visit=async path=>{await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.locator('.le-content').waitFor();};
  const click=async name=>page.getByRole('button',{name,exact:true}).first().click();
  const fill=async(label,value)=>page.getByLabel(label,{exact:true}).fill(String(value));
  const tab=async name=>page.getByRole('tab',{name,exact:true}).click();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('life-edit-demo-v1')));
  const undo=async()=>click('Undo delete');
  try {
    await page.addInitScript(()=>{if(!localStorage.getItem('life-edit-demo-v1'))localStorage.setItem('life-edit-demo-v1',JSON.stringify({version:2,tasks:[]}));});
    await visit('/planner');await click('Add time block');await fill('Title','Morning walk');await click('Save time block');await page.getByRole('button',{name:/Morning walk/}).click();await fill('Title','Evening walk');await click('Save time block');await page.getByRole('button',{name:/Evening walk/}).click();await click('Delete time block');
    await click('Add time block');await fill('Title','Read a chapter');await click('Save time block');await undo();assert.equal((await saved()).tasks.length,2);
    await visit('/life-edit');await tab('Future Self');await fill('Future identity','Creative and grounded');await fill('Vision statement','A meaningful life');await click('Delete vision statement');await undo();assert.equal(await page.getByLabel('Vision statement',{exact:true}).inputValue(),'A meaningful life');await click('Delete future self profile');await undo();
    await click('Add Custom Goal');await fill('Goal title','Run 5k');await page.getByRole('dialog').getByRole('button',{name:'Physical',exact:true}).click();await click('Save goal');await tab('Goals');await click('Edit Run 5k');await fill('Goal title','Run 10k');await click('Save goal');await click('Edit Run 10k');await click('Delete goal');await undo();await page.getByRole('heading',{name:'Run 10k',exact:true}).waitFor();
    for(const [route,add,name] of [['/habits','Add Custom Habit','Read'],['/quit-habits','Add Custom Habit To Quit','Late scrolling']]){await visit(route);await click(add);await fill('Habit name',name);await click('Save habit');await click('Edit '+name);await fill('Habit name',name+' daily');await click('Save habit');await click('Delete '+name+' daily');await undo();await page.getByRole('heading',{name:name+' daily',exact:true}).waitFor();}
    await visit('/journal');await click('New entry');await fill('Title','A quiet morning');await fill('Your thoughts','Today I felt calm.');await click('Save reflection');await page.getByRole('button',{name:/A quiet morning/}).click();await fill('Your thoughts','Today I felt calm and focused.');await click('Save reflection');await page.getByRole('button',{name:/A quiet morning/}).click();await click('Delete entry');await undo();
    console.log('PASS: tasks, goals, habits, quit habits, future profile, vision and journal CRUD with undo preserving later edits.');
    await visit('/finance');await tab('Categories');await click('Add category');await fill('Category name','Creative supplies');await click('Save category');await click('Edit Creative supplies');await fill('Category name','Art');await click('Save category');
    await tab('Transactions');
    for(const [name,type,amount] of [['Salary','Income',10000],['Sketchbook','Expense',1200],['Emergency fund','Savings',2000],['Index fund','Investment',500]]){await click('Add transaction');await fill('Description',name);await page.getByLabel('Type',{exact:true}).selectOption(type);if(!['Income','Savings','Investment'].includes(type))await page.getByLabel('Transaction classification',{exact:true}).selectOption('Need');await fill('Amount',amount);if(type!=='Income')await page.getByLabel('Category',{exact:true}).selectOption('Art');await click('Save transaction');}
    await click('Edit Sketchbook');await fill('Amount',1500);await click('Save transaction');await click('Delete Salary');await undo();
    await tab('Budget');await click('Add budget');await page.getByLabel('Category',{exact:true}).selectOption('Art');await fill('Budget amount',4500);await click('Save budget');await click('Edit Art budget');await fill('Budget amount',5000);await click('Save budget');await click('Delete Art budget');await undo();
    await tab('Overview');await page.getByText(/25[.,]0%/,{exact:true}).waitFor();assert.equal(await page.getByRole('img',{name:/Spending distribution/}).count(),1);
    await tab('Guidance');await page.getByLabel('Show optional budget guidance').check();await fill('Needs (%)',60);await click('Save allocation');await page.getByText('Your allocation must total 100%.',{exact:true}).waitFor();await fill('Wants (%)',20);await click('Save allocation');assert.equal((await saved()).allocation.needs,60);
    await tab('Savings goals');await click('Add savings goal');await fill('Goal name','Travel');await fill('Target amount',5000);await fill('Amount saved',500);await click('Save savings goal');await click('Edit Travel');await fill('Amount saved',750);await click('Save savings goal');await click('Delete Travel');await undo();
    await tab('Categories');await click('Delete Art');await undo();
    await tab('Overview');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'test-results/v3-finance.png',fullPage:true,animations:'disabled'});
    console.log('PASS: finance categories, income/expense CRUD, budgets, savings goals, analytics and allocation validation.');
    for(const [route,subtab,add,fields,save,name] of [
      ['/social',null,'Add relationship',{'Name':'Sam','Shared or monthly connection goal':'Monthly coffee','Personal notes':'College friend'},'Save relationship','Sam'],
      ['/spiritual','Prayer requests','Add prayer request',{'Title':'Family peace','Prayer and reflection':'Be present'},'Save prayer request','Family peace'],
      ['/spiritual','Bible study plans','Add Bible study plan',{'Title':'John study','Passage or reading plan':'John 1-21','Progress (%)':'20'},'Save Bible study plan','John study']
    ]) {await visit(route);if(subtab)await tab(subtab);await click(add);for(const [label,value] of Object.entries(fields))await fill(label,value);await click(save);await click('Edit '+name);await fill(Object.keys(fields)[0],name+' updated');await click(save);await click('Archive '+name+' updated');await page.getByLabel('Show archived').check();await click('Restore '+name+' updated');await page.getByLabel('Show archived').uncheck();await click('Delete '+name+' updated');await undo();}
    await visit('/settings');await click('Add journal template');await fill('Journal name','Creative notes');await fill('Prompts (one per line)','What did I make?');await click('Save journal template');await click('Edit Creative notes');await fill('Prompts (one per line)','What did I learn?');await click('Save journal template');await click('Delete Creative notes');await undo();
    console.log('PASS: relationships, prayers, Bible study plans and journal templates including archive/restore.');
    await visit('/fitness');await tab('Plans');await click('Use Upper Body template');await fill('Workout name','Tuesday strength');await fill('Cool down','Gentle stretches');await click('Save workout');await tab('Workouts');await click('Edit Tuesday strength');await page.getByLabel('Weight (kg)',{exact:true}).first().fill('30');await click('Save workout');await click('Log workout');await fill('Duration (minutes)',45);await click('Save workout log');await click('Edit Tuesday strength log');await fill('Duration (minutes)',50);await click('Save workout log');
    await tab('Progress');await page.getByText('30 kg × 10',{exact:true}).waitFor();await click('Add progress entry');await fill('Body weight (kg)',70);await fill('Waist (cm)',80);await click('Save progress entry');await page.getByRole('img',{name:/Weight trend/}).waitFor();
    await tab('Exercise Library');await click('Create custom exercise');await fill('Exercise name','Cable fly');await fill('Weight (kg)',10);await click('Save exercise');await click('Edit Cable fly');await fill('Exercise name','Cable chest fly');await click('Save exercise');await click('Delete Cable chest fly');await undo();
    await tab('Workouts');await click('Delete Tuesday strength');await undo();await click('Edit Tuesday strength');await click('Remove Bench Press');await click('Undo remove exercise');await click('Save workout');
    await tab('Progress');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'test-results/v3-fitness.png',fullPage:true,animations:'disabled'});
    console.log('PASS: workout templates, plans, custom exercises, exercise undo, actual logs, personal records and body measurements.');
    await visit('/focus');await page.clock.install();await fill('Focus duration (minutes)',1);await fill('Break duration (minutes)',1);await fill('Number of sessions',2);await click('Start');await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Planner',exact:true}).click();await page.clock.fastForward(61000);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('life-edit-demo-v1')).focusPlan.completed===1);assert.equal((await saved()).focusPlan.phase,'break');await page.reload({waitUntil:'domcontentloaded'});await page.locator('.le-content').waitFor();await page.clock.fastForward(121000);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('life-edit-demo-v1')).focusPlan.phase==='finished');assert.equal((await saved()).focus.length,2);
    console.log('PASS: focus sessions continue through navigation and refresh; breaks and final completion log exactly once.');
    await page.setViewportSize({width:390,height:844});
    for(const route of ['/finance','/fitness','/focus','/social','/spiritual','/settings']){await visit(route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile overflow '+route);}
    await visit('/finance');await page.screenshot({path:'test-results/v3-mobile.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);console.log('PASS: mobile layouts and no browser runtime errors.');
  } catch(e) {fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/v3-failure.png',fullPage:true});console.error(await page.locator('body').innerText());throw e;} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
