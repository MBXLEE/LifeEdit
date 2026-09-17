# CRUD and planning update

The workspace now supports create, read, update, and delete for tasks, goals,
build and quit habits, journals, budget categories, transactions of every type,
savings goals, workout plans and exercises, relationships, prayer requests,
Bible study plans, the future-self profile, vision statements, and custom
category lists. Goals, savings goals, workout plans, relationships, prayers,
and study plans also support archive and restore.

Deleted top-level records offer Undo until another deletion replaces the undo
action, the action is dismissed, or the page is refreshed. Undo restores the
deleted records without replacing unrelated edits made afterward. Workout
builder exercise removal has its own undo before saving. Category deletion
removes the selectable option, preserves historical records, and can be undone.
Renaming budget categories also updates their transactions and budgets.

## Focus

Focus duration, break duration, and session count are independently configurable.
Active plans persist in the workspace, using absolute phase deadlines and
deterministic session IDs. They continue across navigation and refresh. A late
browser wake-up catches up elapsed phases without duplicating history. Pausing
freezes the remaining phase duration; resetting keeps completed session history.
There is no break after the last session. Sessions advance automatically; if a
device sleeps, elapsed sessions are considered completed on return.

## Finance

Charts, budgets and health metrics are scoped to the selected currency and month.
The comparison chart covers six months ending at the selected month. Savings
and investment transfers are separate transaction types, not double-counted as
ordinary expenses. Savings rate is savings contributions divided by recorded
income; with no income, the rate is explicitly unavailable. Savings goals track
their own user-entered balance and are not automatically credited by transactions.
Changing currency never converts historical amounts.

Optional 50/30/20 guidance can be customized and saved only when percentages
total 100. The starting guideline is documented by the
[Consumer Financial Protection Bureau](https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/analyzing-budgets/).

## Fitness

Templates and library exercises are selectable starting points, not personal
completed workouts. Plans have warm-up, main workout and cool-down sections.
Every exercise records sets, reps, kg, duration, rest, and notes. Completed logs
store a snapshot of actual exercises. Later plan edits do not rewrite historical
logs. Personal records use the highest recorded weight per exercise name;
volume uses sets × reps × weight. Body measurements and monthly workout totals
are editable. The exercise library links to
[ACE's exercise guidance](https://www.acefitness.org/resources/everyone/exercise-library/).

## Verification and storage

- `node tests/domain-three.cjs`: focus timing and catch-up boundary cases.
- `node tests/version-three.cjs`: browser CRUD, undo, financial calculations,
  templates, fitness records, focus navigation/refresh, and mobile layouts.
- `npm run typecheck` and `npm run build`.

The browser suite requires Playwright and installed Microsoft Edge. Set NODE_PATH
to the bundled runtime's node_modules if Playwright is not installed locally.
LIFE_EDIT_URL defaults to `http://localhost:3003`.

New data is additive to the existing workspace document; older local data remains
compatible. Account-backed storage still requires the Supabase configuration and
migrations described in `version-two.md`. Live cloud authentication and RLS must
be verified in a configured Supabase project.
