const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.env.LIFE_EDIT_URL || 'http://localhost:3004';

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'lifeedit-pwa-'));
  let context;
  const errors=[];
  const launch = async () => {
    context = await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:375,height:667},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page = await context.newPage();page.on('pageerror',error=>errors.push(error.message));return page;
  };
  try {
    let page=await launch();
    await page.goto(base+'/dashboard');await page.locator('.le-content').waitFor();
    const manifest=await (await page.request.get(base+'/manifest.webmanifest')).json();
    assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/dashboard');
    for(const icon of manifest.icons)assert.equal((await page.request.get(base+icon.src)).status(),200);
    const splash=await page.locator('link[rel="apple-touch-startup-image"]').first().getAttribute('href');assert.equal((await page.request.get(base+splash)).status(),200);
    await page.getByRole('button',{name:'Install The Life Edit',exact:true}).click();
    await page.getByRole('dialog').getByText('iPhone or iPad',{exact:true}).waitFor();await page.getByRole('dialog').getByText('Android',{exact:true}).waitFor();
    await page.evaluate(()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.installCalled=true;};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);});
    await page.getByRole('button',{name:'Install App',exact:true}).click();assert.equal(await page.evaluate(()=>window.installCalled),true);
    await page.goto(base+'/login');await page.getByRole('button',{name:'Demo User Login',exact:true}).waitFor();await page.getByRole('button',{name:'Continue As Guest',exact:true}).waitFor();
    await page.getByRole('button',{name:'Demo User Login',exact:true}).click();await page.waitForURL('**/dashboard');await page.locator('.le-content').waitFor();
    const routes=['dashboard','planner','focus','life-edit','journal','insights','finance','fitness','social','habits','quit-habits','settings','onboarding'];
    fs.mkdirSync('test-results/pwa',{recursive:true});
    for(const [width,height] of [[320,568],[375,667],[390,844],[393,852],[430,932],[360,800],[412,915],[844,390],[768,1024],[820,1180],[1024,768]]) {
      await page.setViewportSize({width,height});
      for(const route of routes) {
        await page.goto(base+'/'+route);await page.locator('.le-content').waitFor();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${route} page overflow`);
        if(route==='finance'&&width<=1024)assert.ok((await page.locator('h1').boundingBox()).height<45,'Finance title must fit one line');
        if(width<=1024) {
          const links=page.getByRole('navigation',{name:'Quick navigation'}).getByRole('link');
          assert.equal(await links.count(),6);
          for(const link of await links.all()) {const rect=await link.boundingBox();assert.ok(rect.width>=44 && rect.height>=44,`${width} touch target`);assert.ok(rect.y+rect.height<=height);}
          if(route!=='dashboard')await page.getByRole('button',{name:'Back',exact:true}).first().waitFor();
        }
      }
      if(width===375)await page.screenshot({path:'test-results/pwa/iphone-se-onboarding.png',animations:'disabled'});
    }
    await page.goto(base+'/settings');await page.getByLabel('Display name',{exact:true}).fill('Mobile Tester');await page.waitForTimeout(500);
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.goto(base+'/dashboard');await page.locator('.le-content').waitFor();
    await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
    await page.waitForFunction(async()=>{for(const key of await caches.keys()){if(key.startsWith('lifeedit-shell-DEMO-')&&await (await caches.open(key)).match('/dashboard'))return true;}return false;});
    await context.close();page=await launch();
    await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
    await page.goto(base+'/dashboard');await page.locator('.le-content').waitFor();assert.match(await page.locator('h1').innerText(),/Mobile/);
    assert.equal(await page.getByLabel('Install app invitation').count(),0);
    await context.setOffline(true);await page.reload();await page.locator('.le-content').waitFor();assert.match(await page.locator('h1').innerText(),/Mobile/);
    await page.screenshot({path:'test-results/pwa/offline-relaunch.png',animations:'disabled'});
    assert.deepEqual(errors,[]);
    console.log('PASS: manifest/icons/splashes, iOS/Android guide, native-prompt event, mobile demo login, 143 phone/tablet/landscape screen checks, six touch-friendly tabs, browser restart persistence, standalone suppression and offline demo reopen.');
  } finally {
    await context?.close();
    if(path.dirname(profile)===os.tmpdir() && path.basename(profile).startsWith('lifeedit-pwa-'))fs.rmSync(profile,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
