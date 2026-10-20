const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { removeGoalAndReferences, pillarIsReferenced } = load('lib/data-integrity.ts');

const data = {
  goals: [
    { id: 'parent', parent: '', pillars: ['Career'] },
    { id: 'child', parent: 'parent', pillars: ['Personal Growth'] },
  ],
  board: [{ id: 'vision', goalId: 'parent', category: 'Career' }],
  journals: [], templates: [], tasks: [], lifeResets: [], improvementPlans: [],
};

const cleaned = removeGoalAndReferences(data, 'parent');
assert.deepEqual(cleaned.goals.map(goal => [goal.id, goal.parent]), [['child', '']]);
assert.equal(cleaned.board.length, 0);
assert.equal(pillarIsReferenced(data, 'Career'), true);
assert.equal(pillarIsReferenced({ ...data, goals: [], board: [] }, 'Career'), false);

console.log('PASS: deleting a goal clears child and vision references, and used pillars cannot be removed.');
