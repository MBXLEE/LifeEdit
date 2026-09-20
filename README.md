# The Life Edit

The Life Edit is a Next.js PWA for personal planning, focus, habits, finance, fitness, journaling, and reflection.

## Requirements

- Node.js 20 or newer
- npm
- A Chromium-based browser, Edge, Chrome, or Safari/Firefox for browser-specific checks
- Optional: Supabase project values in `.env.local`

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` when testing account auth. Without Supabase, the app runs in local preview mode.

## Start The App

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If port 3000 is busy, Next.js will offer another port.

## Mobile Preview

This project is a responsive web/PWA app, so the correct mobile development path is browser device emulation rather than a native emulator.

Visual Studio:

1. Open the folder in Visual Studio.
2. Use the npm scripts window or terminal to run `npm run dev`.
3. Open the local URL in Edge or Chrome.
4. Press `F12`, toggle device emulation, and test phone profiles such as iPhone SE, iPhone 14, Pixel 7, and Galaxy S20.

Visual Studio Code:

1. Open the workspace.
2. Run the `Next.js dev server` task, or press `F5` and choose the Edge mobile preview launch config.
3. Use the browser device toolbar in portrait mode.

Check planner modals, forms, navigation, focus timer controls, and notification permission from mobile widths. The app manifest and service worker allow install-style PWA testing on supported browsers.

## Notifications

Notifications are configured in Settings. The app explains the reason before requesting browser permission and does not keep prompting after denial.

Test flow:

1. Start the app on `localhost`.
2. Open Settings.
3. Select `Enable notifications`.
4. Choose categories and reminder times.
5. Create a planner task a few minutes in the future or start a short focus session.
6. Keep the app or installed PWA open and wait for the notification.
7. Tap the notification to confirm it opens the related screen.

Browser limitations:

- Browser timers can be throttled while a tab is backgrounded.
- Notifications while the browser/PWA is fully closed require platform push support and a backend push service.
- iOS notification support depends on installing the PWA and granting permission from the installed app.
- This client implementation schedules, deduplicates, updates, and cancels reminders while the app is running by rebuilding timers from current data.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
npm run test:focused
```

The existing Playwright-style scripts in `tests/` can be run against a local dev server by setting `LIFE_EDIT_URL` when needed, for example:

```bash
$env:LIFE_EDIT_URL="http://localhost:3000"
node tests/progress-controls.cjs
```
