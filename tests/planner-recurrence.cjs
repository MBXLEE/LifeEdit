const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { taskOccursOn, taskDoneOn, setTaskDoneOn, excludeTaskOccurrence, completedTaskDates, taskOccurrenceCount } = load('lib/planner.ts');

const task = (patch = {}) => ({ id:'t1', title:'Plan', date:'2026-01-31', time:'09:00', minutes:30, pillar:'Personal Growth', done:false, kind:'time-block', recurrence:'none', ...patch });

assert.equal(taskOccursOn(task(),'2026-01-31'),true);
assert.equal(taskOccursOn(task(),'2026-02-01'),false);
assert.equal(taskOccursOn(task({recurrence:'daily'}),'2026-02-01'),true);
assert.equal(taskOccursOn(task({recurrence:'weekdays'}),'2026-02-02'),true);
assert.equal(taskOccursOn(task({recurrence:'weekdays'}),'2026-02-01'),false);
assert.equal(taskOccursOn(task({recurrence:'weekly'}),'2026-02-07'),true);
assert.equal(taskOccursOn(task({recurrence:'monthly'}),'2026-02-28'),true,'month-end recurrence clamps to the final day');
assert.equal(taskOccursOn(task({recurrence:'monthly'}),'2026-03-31'),true);
assert.equal(taskOccursOn(task({recurrence:'monthly',recurrenceEnd:'2026-02-28'}),'2026-03-31'),false);
assert.equal(taskOccursOn(task({recurrence:'daily',excludedDates:['2026-02-01']}),'2026-02-01'),false);

const completed = setTaskDoneOn(task({recurrence:'daily'}),'2026-02-01',true);
assert.equal(taskDoneOn(completed,'2026-02-01'),true);
assert.equal(taskDoneOn(completed,'2026-02-02'),false);
assert.deepEqual(completedTaskDates(completed,'2026-02-01','2026-02-28'),['2026-02-01']);
const excluded = excludeTaskOccurrence(completed,'2026-02-01');
assert.equal(taskOccursOn(excluded,'2026-02-01'),false);
assert.equal(taskDoneOn(excluded,'2026-02-01'),false);
assert.equal(taskOccurrenceCount([completed,task({id:'t2',date:'2026-02-02',done:true})],'2026-02-01','2026-02-28'),2);

console.log('PASS: shared task recurrence covers daily, weekdays, weekly, monthly month-end, end dates, completion and single-occurrence exclusion.');
