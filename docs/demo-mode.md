# Demo and Production Modes

Set `APP_MODE=DEMO` or `APP_MODE=PRODUCTION` in `.env.local` or your deployment environment, then restart development or rebuild production. The mode is resolved at build time and shared by browser code and middleware.

- Without an explicit mode, missing public Supabase credentials select DEMO. When both credentials exist, the default is PRODUCTION.
- DEMO bypasses authentication, never calls Supabase, and opens a populated Demo User workspace automatically. The login page also provides Demo User Login and Continue As Guest.
- Guest has a separate, initially empty workspace. Switching profiles restores each profile's own saved records.
- PRODUCTION enforces Supabase authentication and never reads or writes demo workspaces. Explicit PRODUCTION with missing credentials remains locked; it does not silently fall back to local storage.

Demo and guest records use `life-edit-demo-v1` and `life-edit-guest-v1` in localStorage. Uploads use the existing `life-edit-images` IndexedDB database. Sample dates are relative to the first visit. CRUD, focus sessions, analytics, and exports use the same application logic as production.

Settings > Reset Demo Data asks for confirmation, clears both local workspaces and local uploads, and opens an empty Ocean-themed Demo User onboarding flow. Refreshing after reset does not restore samples. Other sites' storage and Supabase records are untouched. Close other Life Edit tabs before resetting.

The demo notice is dismissible. Local data is specific to this browser and origin and is not encrypted or synced. Connecting Supabase does not automatically migrate demo records; export any test data you want to retain before switching. Do not use demo mode for sensitive production records.
