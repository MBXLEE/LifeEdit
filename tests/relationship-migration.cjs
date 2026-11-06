const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { hydrateRelationship, syncRelationshipPlans } = load('lib/life-domain.ts');

const legacy = { id: 'friend-1', name: 'Sam', type: 'Friends', birthday: '1990-11-05', followUp: '2026-11-10', goal: 'Plan a visit', notes: 'Enjoys cooking', memories: 'Graduation day', archived: false };
const migrated = hydrateRelationship(legacy);
assert.equal(migrated.notes, legacy.notes);
assert.equal(migrated.goal, legacy.goal);
assert.equal(migrated.memories, legacy.memories);
assert.deepEqual(migrated.moments, [{ id: 'legacy-memory-friend-1', kind: 'memory', date: '', title: 'An earlier memory', body: 'Graduation day', photos: [] }]);
assert.equal(migrated.reminderEnabled, true);
assert.equal(hydrateRelationship({ ...legacy, reminderEnabled: false }).reminderEnabled, false);
assert.deepEqual(hydrateRelationship({ ...migrated, moments: [] }).moments, [], 'deleted migrated memories stay deleted');
const linked = { ...migrated, plans: [{ id: 'plan-1', title: 'Coffee', date: '2026-11-10', note: '', completed: false, plannerTaskId: 'task-1' }] };
const synced = syncRelationshipPlans([linked], [{ id: 'task-1', date: '2026-11-12', done: true }]);
assert.deepEqual(synced[0].plans[0], { ...linked.plans[0], date: '2026-11-12', completed: true });
assert.equal(syncRelationshipPlans([linked], [])[0].plans[0].title, 'Coffee', 'removing a Planner task keeps the relationship plan');
console.log('PASS: legacy relationship details and memories migrate without data loss.');
