const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.LIFE_EDIT_URL || 'http://localhost:3003';
  const visit = async path => { await page.goto(base + path, { waitUntil: 'domcontentloaded' }); await page.locator('.le-content').waitFor(); };
  const click = async name => page.getByRole('button', { name, exact: true }).click();
  const fill = async (label, value) => page.getByLabel(label, { exact: true }).fill(value);
  const tab = async name => page.getByRole('tab', { name, exact: true }).click();
  try {
    await visit('/dashboard');
    assert.equal(await page.getByText('Your day is a blank page.', { exact: true }).count(), 1);
    assert.equal(await page.getByText('No habits added yet.', { exact: true }).count(), 1);
    await visit('/onboarding');
    await fill('What should we call you?', 'Alex');
    await click('Continue');
    await click('Continue');
    await page.getByRole('alert').getByText('Please rate each life pillar before continuing.').waitFor();
    for (const slider of await page.getByRole('slider').all()) await slider.fill('7');
    await click('Continue'); await click('Physical'); await click('Add Custom Area'); await fill('Add Custom Area', 'Creativity'); await click('Add');
    await click('Continue'); await click('Reading'); await click('Add Custom Habit'); await fill('Add Custom Habit', 'Daily sketch'); await click('Add');
    await click('Continue'); await click('Doom Scrolling'); await click('Continue');
    await fill('Future identity', 'A thoughtful, healthy creator'); await fill('Vision statement', 'Make meaningful work'); await fill('Personal mission', 'Create with care'); await fill('Future lifestyle description', 'Time for health and creativity');
    await click('Continue'); await page.getByRole('button', { name: 'Sage', exact: true }).click(); await click('Continue');
    await page.getByText('A thoughtful, healthy creator', { exact: true }).waitFor(); await click('Complete life edit');
    await page.waitForURL('**/dashboard'); await page.getByRole('heading', { name: 'A little better, Alex.' }).waitFor();
    await page.reload(); await page.getByRole('heading', { name: 'A little better, Alex.' }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'sage');
    await visit('/life-edit'); await click('Add Custom Goal'); await fill('Goal title', 'Run a half marathon'); await page.getByRole('dialog').getByRole('button', { name: 'Physical', exact: true }).click(); await fill('Progress · 0%', '35'); await click('Save goal'); await tab('Goals');
    await page.getByRole('heading', { name: 'Run a half marathon' }).waitFor(); await click('Mark complete'); await click('Edit Run a half marathon'); await fill('Goal title', 'Run my first half marathon'); await click('Save goal'); await click('Archive goal'); await page.getByLabel('Show archived').check(); await click('Restore goal'); await page.getByLabel('Show archived').uncheck();
    await page.getByRole('heading', { name: 'Run my first half marathon' }).waitFor();
    await visit('/journal'); await click('Add Custom Journal'); await fill('Journal name', 'Creative practice'); await fill('Your prompts (one per line)', 'What did I make?\nWhat will I try tomorrow?'); await click('Create journal'); await click('New entry'); await fill('Title', 'My first sketch'); await fill('Your thoughts', 'I made time to draw today.'); await click('Save reflection'); await page.getByRole('button', { name: /My first sketch/ }).click(); await fill('Your thoughts', 'I made time to draw and reflect today.'); await click('Save reflection');
    await visit('/finance'); await page.getByLabel('Currency', { exact: true }).selectOption('custom'); await fill('Currency code', 'KES'); await fill('Currency name', 'Kenyan shilling'); await fill('Currency symbol', 'KSh'); await click('Save currency'); await click('Add Custom Category'); await fill('Add Custom Category', 'Art supplies'); await click('Add'); await tab('Budget'); await click('Add budget'); await page.getByLabel('Category', { exact: true }).selectOption('Art supplies'); await fill('Amount (KES)', '5000'); await click('Save budget'); await tab('Transactions'); await click('Add transaction'); await fill('Description', 'Sketchbook'); await page.getByLabel('Category', { exact: true }).selectOption('Art supplies'); await fill('Amount (KES)', '300'); await click('Save transaction'); await page.getByText('Sketchbook', { exact: true }).waitFor();
    await visit('/habits'); await click('Edit Daily sketch'); await fill('Habit name', 'Sketch every day'); await click('Save habit'); await page.getByRole('button', { name: /^Sketch every day 20/ }).last().click();
    await visit('/planner'); await click('Add time block'); await fill('Title', 'Morning run'); await fill('Duration (minutes)', '45'); await click('Save time block'); await tab('Week'); await page.getByRole('button', { name: /Morning run/ }).click(); await fill('Title', 'Morning long run'); await click('Save time block'); await tab('Month');
    await visit('/fitness'); await click('Add Custom Workout Type'); await fill('Add Custom Workout Type', 'Trail running'); await click('Add'); await click('Create workout plan'); await fill('Workout name', 'Saturday strength'); await click('Add exercise'); await fill('Exercise name', 'Squat'); await fill('Weight (kg)', '20'); await click('Save workout'); await click('Log workout'); await fill('Duration (minutes)', '40'); await click('Complete workout'); await page.getByRole('heading', { name: 'Saturday strength' }).waitFor();
    await visit('/focus'); await click('Start'); await page.waitForTimeout(1200); await click('Pause'); assert.notEqual(await page.locator('.le-ring strong').textContent(), '25:00');
    await visit('/dashboard'); await page.screenshot({ path: 'test-results/v2-desktop.png', fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'test-results/v2-mobile.png', fullPage: true, animations: 'disabled' });
    for (const path of ['/dashboard','/planner','/focus','/life-edit','/journal','/insights','/finance','/fitness','/habits','/quit-habits','/onboarding','/settings']) {
      await visit(path);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Mobile overflow at ${path}`);
    }
    await visit('/settings'); await page.getByRole('button', { name: 'Midnight', exact: true }).click(); await page.screenshot({ path: 'test-results/v2-midnight.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('link', { name: 'Focus', exact: true }).click();
    await page.waitForURL('**/focus'); await click('Back'); await page.waitForURL('**/settings');
    await click('Open navigation'); await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Finance', exact: true }).click(); await page.waitForURL('**/finance');
    await page.goto(base + '/login'); await page.getByRole('link', { name: 'Explore local preview' }).click(); await page.locator('.le-content').waitFor();
    assert.equal(errors.length, 0, errors.join('\n'));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('life-edit-preview-v2')));
    assert.equal(saved.goals[0].progress, 100); assert.equal(saved.journals.length, 1); assert.equal(saved.currency, 'KES'); assert.equal(saved.workoutLogs.length, 1); assert.equal(saved.tasks[0].title, 'Morning long run');
    console.log('PASS: onboarding, refresh persistence, goal lifecycle, custom journals, currencies, budgets, transactions, habit editing, planner views, workouts, focus timer, all mobile layouts, themes, auth-to-preview navigation.');
  } catch (error) {
    fs.mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/failure.png', fullPage: true });
    console.error(await page.locator('body').innerText());
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
