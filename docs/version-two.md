# Version 2

The desktop layout remains the product experience. The Figma palette, serif
headings, soft surfaces, generous spacing, and restrained motion carry through
the new working screens. No phone frame or sample personal records are used.

## Local preview

Without Supabase environment variables, the application uses a clearly labeled
local preview. Data is saved in this browser under `life-edit-preview-v2`.
The preview is not an authenticated account and does not sync between devices.
Settings provides a JSON export. Authentication forms explain when account
access has not been configured.

## Account setup

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using
   `.env.example` as a reference.
2. Apply both SQL files in `supabase/migrations` to the Supabase project.
3. Set the Supabase Auth site URL to your deployment URL. Allow
   `/auth/callback` on that origin, including the `next=/onboarding` and
   `next=/reset-password` redirect URLs used by the app. Enable Google in
   Supabase Auth if Google sign-in is required.
4. Restart Next.js and verify signup, email confirmation, login, recovery,
   logout, and isolation between two real accounts.

The Version 2 workspace is a versioned JSON document in `life_workspaces`.
Reads are protected by owner-only RLS. The authenticated save RPC checks the
owner, payload size, and expected revision, then updates the profile's
onboarding state in the same transaction. Concurrent revisions fail rather
than overwrite newer data silently. Existing Version 1 domain tables are
preserved; they are not the source of Version 2 UI data.

Signed-in workspace content is not copied into local preview storage. A failed
save stays visible and navigation away from unsaved changes triggers a browser
warning. Changes in another device are loaded on refresh; live merging of
concurrent edits is not implemented. For a revision conflict, export the open
workspace before refreshing to load the newer version.

## Verification

- `npm run typecheck`
- `npm run build`
- `node tests/version-two.cjs` with Playwright available through NODE_PATH.
  The test uses installed Microsoft Edge headlessly and an isolated browser
  context. Set `LIFE_EDIT_URL` to override `http://localhost:3003`.

The browser suite covers onboarding validation and review, persistence after
refresh, goal editing/completion/archive/restore, custom journal templates,
custom currencies/categories, budgets/expenses, habits, planner views,
workouts/logs, focus controls, theme changes, and mobile overflow checks.
It does not substitute for real Supabase authentication and database checks.

## Current boundaries

- The daily alignment ring measures today's scheduled tasks and build habits.
- Insights reports recorded data and the latest self-assessment, not inferred
  historical pillar scores.
- The focus timer now persists across screens and refresh; see `crud-and-planning.md`.
- Vision board images use user-provided HTTPS image URLs.
- Currency values are tracked separately; changing currency does not convert
  amounts or relabel previous transactions.
