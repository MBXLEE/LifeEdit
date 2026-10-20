const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { syncedActivities, activityCountInWindow, commitmentComplete, supportedResetLinkedFeatures } = load('lib/reset-progress.ts');

const reset = { id:'r',name:'Reset',startDate:'2026-10-01',endDate:'2026-10-31',duration:31,status:'active',accountability:'Flexible',intensity:'Balanced',restoreAllowance:1,editAllowance:1,commitments:[],activities:[],photos:[],changes:[],restores:[],pillars:['Physical'],share:{},createdAt:'',updatedAt:'' };
const data = {
  habits:[{id:'read',name:'Read 10 pages',direction:'build',start:'2026-10-01',dates:['2026-10-02'],setbacks:[]},{id:'water',name:'Drink water',direction:'build',start:'2026-10-01',dates:['2026-10-02'],setbacks:[]}],
  journals:[{id:'j1',title:'Evening reflection',body:'',pillar:'Mental & Emotional',date:'2026-10-02'},{id:'j2',title:'Money note',body:'',pillar:'Financial',date:'2026-10-02'}],
  workoutLogs:[{id:'w1',name:'Morning session',date:'2026-10-02'},{id:'w2',name:'Evening session',date:'2026-10-02'}],
  tasks:[{id:'t1',title:'Study maths',date:'2026-10-01',time:'09:00',minutes:30,pillar:'Personal Growth',done:false,recurrence:'daily',completedDates:['2026-10-02']}],
  focus:[{id:'f1',name:'Study maths',date:'2026-10-02',seconds:1800},{id:'f2',name:'Admin',date:'2026-10-02',seconds:900}],
  prayers:[],studyPlans:[]
};

assert.deepEqual([...supportedResetLinkedFeatures],['Fitness','Habits','Journal','Planner','Spiritual','Focus']);
const habit = {id:'c1',title:'Read 10 pages',type:'daily',required:true,pillar:'Personal Growth',linkedFeature:'Habits',sourceHint:'read'};
assert.deepEqual(syncedActivities(data,reset,habit).map(row=>row.externalId),['read']);
const journal = {id:'c2',title:'Reflect',type:'daily',required:true,pillar:'Mental & Emotional',linkedFeature:'Journal'};
assert.deepEqual(syncedActivities(data,reset,journal).map(row=>row.externalId),['j1'],'unrelated pillar journals do not satisfy a reset');
const planner = {id:'c3',title:'Study',type:'daily',required:true,pillar:'Personal Growth',linkedFeature:'Planner',sourceHint:'study'};
assert.deepEqual(syncedActivities(data,reset,planner).map(row=>row.date),['2026-10-02'],'recurring Planner completions are synchronised by occurrence date');
const focus = {id:'c4',title:'Study focus',type:'daily',required:true,pillar:'Personal Growth',linkedFeature:'Focus',sourceHint:'study'};
assert.deepEqual(syncedActivities(data,reset,focus).map(row=>row.externalId),['f1']);
const workouts = {id:'c5',title:'Complete two workouts',type:'daily',targetPerDay:2,required:true,pillar:'Physical',linkedFeature:'Fitness',sourceHint:'workout'};
assert.equal(activityCountInWindow(data,reset,workouts,'2026-10-02'),2);
assert.equal(commitmentComplete(data,reset,workouts,'2026-10-02'),true);
const manualReset = {...reset,activities:[{id:'manual',commitmentId:'c5',date:'2026-10-02',source:'reset'}]};
assert.equal(activityCountInWindow(data,manualReset,workouts,'2026-10-02'),2,'a manual check does not double-count a synced date');
assert.equal(syncedActivities(data,reset,{...habit,linkedFeature:'Finance'}).length,0);
assert.equal(syncedActivities(data,reset,{...habit,linkedFeature:'Goals'}).length,0);

console.log('PASS: Reset sync excludes unsupported links, filters unrelated records, honours recurring Planner completions and counts repeated activities correctly.');
