const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.LIFE_EDIT_URL || 'http://localhost:3004';
  const visit = async route => {
    await page.goto(base + route);
    await page.locator('.le-content').waitFor();
  };
  try {
    await visit('/settings');
    await page.getByLabel('Display name', { exact: true }).fill('Jane Smith');
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('life-edit-demo-v1'));
      const date = new Date();
      const day = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const ratings = Object.fromEntries(data.areas.map(area => [area,7]));
      Object.assign(data, { onboarded:true, assessment:ratings, reviews:[{id:'test-review',date:day,ratings,notes:''}], identity:'A purposeful, grounded life', vision:'Building healthy routines and making time for what matters.', tasks:[
        {id:'task-1',title:'Morning workout',date:day,time:'07:00',minutes:60,pillar:'Physical',done:true},
        {id:'task-2',title:'Complete assignment',date:day,time:'09:00',minutes:90,pillar:'Personal Growth',done:false},
        {id:'task-3',title:'Evening reflection',date:day,time:'20:00',minutes:30,pillar:'Spiritual',done:false},
      ], habits:[{id:'habit-1',name:'Read for 30 minutes',direction:'build',dates:[day],start:day,setbacks:[]}] });
      localStorage.setItem('life-edit-demo-v1', JSON.stringify(data));
    });
    await visit('/dashboard');
    assert.match(await page.locator('h1').innerText(), /Jane/);
    assert.equal(await page.getByLabel('Open profile settings').innerText(), 'JS');
    assert.deepEqual(await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('link').allTextContents(), ['Home', 'Planner', 'Focus', 'Life Edit', 'Journal', 'Insights']);
    await page.locator('.le-explore').getByRole('link', { name: 'Finance', exact: true }).click();
    await page.waitForURL('**/finance');
    assert.match(page.url(), /finance$/);
    fs.mkdirSync('test-results/mobile', { recursive: true });
    const routes = ['/dashboard','/planner','/focus','/journal','/life-edit','/insights','/finance','/fitness','/social','/habits','/quit-habits','/settings','/onboarding'];
    for (const width of [320,375,390,393,414,430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of routes) {
        await visit(route);
        assert.equal(await page.locator('.le-sidebar').isVisible(), false, `${width} ${route} sidebar`);
        assert.equal(await page.getByLabel('Toggle sidebar').isVisible(), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width} ${route} overflow`);
        assert.equal(await page.locator('.le-mobile-nav').count(), 1);
        if (width === 390) {
          await page.screenshot({ path: `test-results/mobile/${route.slice(1)}.png`, animations: 'disabled', fullPage: true });
          await page.screenshot({ path: `test-results/mobile/${route.slice(1)}-viewport.png`, animations: 'disabled' });
        }
      }
    }
    await page.goto(base + '/login');
    assert.equal(await page.locator('.le-mobile-nav').count(), 0);
    await page.screenshot({ path: 'test-results/mobile/login.png', fullPage: true });
    await page.setViewportSize({ width: 900, height: 900 });
    await visit('/dashboard');
    assert.equal(Math.round((await page.locator('.le-sidebar').boundingBox()).width), 80);
    await page.getByLabel('Toggle sidebar').click();
    await page.waitForTimeout(300);
    assert.equal(Math.round((await page.locator('.le-sidebar').boundingBox()).width), 224);
    await page.reload();
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.le-app').getAttribute('data-sidebar'), 'expanded');
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page.locator('.le-mobile-nav').isVisible(), false);
    await page.getByLabel('Toggle sidebar').click();
    await page.waitForTimeout(300);
    assert.equal(Math.round((await page.locator('.le-sidebar').boundingBox()).width), 80);
    await page.screenshot({ path: 'test-results/mobile/desktop-compact.png', fullPage: true });
    await visit('/settings');
    await page.getByLabel('Display name', { exact: true }).fill('');
    await page.waitForTimeout(700);
    await visit('/dashboard');
    assert.doesNotMatch(await page.locator('h1').innerText(), /Jane|Mbali|undefined/);
    assert.equal(await page.getByLabel('Open profile settings').innerText(), 'LE');
    assert.deepEqual(errors, []);
    console.log('PASS: 78 mobile route/width checks, navigation, profile greetings, auth exclusion and onboarding navigation, tablet rail and persistent desktop collapse.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
