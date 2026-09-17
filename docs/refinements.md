# Lifestyle refinements

## Fitness

Progress is the default tab, followed by Workouts, Exercise Library, Plans, and Settings. Dated progress entries drive weight and measurement trends, starting/current weight, and historical comparisons. Goal weight is editable in Settings. Workout logs drive the selected month's calendar, active days, duration, volume, and personal records. Photos have separate dates, titles, and notes with edit/delete/undo.

## Finance

Available to allocate is income minus reserved category budgets, minus spending outside budgets, minus category overspending. Spending within a reserved budget is not deducted again. Remaining in budgets is budgeted amounts minus actual outgoings in those categories. Reservations and actual transactions are distinct; allocating money does not fabricate an expense. The main metric, financial health details, and six-month chart all use this allocation-based balance. Investments recorded by older versions count toward savings; giving counts toward expenses. Savings-classified outgoings are savings, regardless of their older flow type. Income never counts in outgoing classification percentages.

Outgoing transactions require a Need, Want, or Savings classification. Income has an optional source instead of expense category/classification fields. Legacy expenses without a classification remain explicitly Unclassified. Budgets reserve income: creating one reduces available-to-allocate funds but does not create a transaction. Category actuals come from non-income transactions in the selected currency and month. Clicking a spent amount opens the underlying records for creation, editing, or deletion. Budget analytics separate budgeted categories from unbudgeted outgoings. Allocation targets use monthly income; actuals use classified outgoings. When guidance is enabled, saved allocations show warnings at 90%, at the target, and above it. With no income, allocation warnings are suppressed rather than inventing a percentage. Currencies are tracked independently, not converted.

## Relationships and vision

Relationship records include configurable types, importance, contact dates, conversation notes, shared goals, ideas, and memories. Check-ins due are calculated from the stored date. Vision items include categories, motivation notes, an optional goal link, and an optional uploaded or HTTPS image. Renaming categories updates linked records; deleting a category preserves historical records.

## Life balance reviews

Weekly, monthly, and quarterly prompts are in-app only, not background email or push notifications. The latest dated review determines the next due date; monthly and quarterly dates clamp to the last valid day of the target month. Reviews support editing, deletion, and undo. Growth charts can show the overall mean or a specific pillar. Self-assessment ratings are distinct from action alignment, which uses three equally weighted, disclosed signals per pillar. Activity windows and missing evidence are explicitly explained. No mood data is invented.

## Media and deployment

Local preview images live in IndexedDB on this browser and origin; workspace JSON contains references, not image bytes. JSON exports alone do not back up local images. Account uploads use the existing private Supabase `vision-board` bucket and owner-prefixed paths. Existing storage policies must be applied. Images are JPEG, PNG, or WebP, at most 5 MB, and decoded before upload. Deleted image files are retained so undo can restore them; automatic orphan cleanup is not yet implemented.

Live Supabase authentication, storage policies, and cross-device sync require configured credentials and deployment verification. Local preview verification does not substitute for those checks.

## Checks

- `node tests/refinements.cjs`: finance classification, negative balance, recurrence, month ends.
- `node tests/domain-three.cjs`: timer transitions and catch-up.
- `node tests/version-four.cjs`: isolated Edge browser workflows, persisted images, CRUD/undo, finance calculations, review history, mobile overflow, and runtime errors. Set `LIFE_EDIT_URL` to the preview URL; default is port 3004. Playwright must be available on `NODE_PATH` or installed locally.
