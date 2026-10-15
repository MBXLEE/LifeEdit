Notifications follow saved user commitments. Planner reminders are one per occurrence (including recurring tasks), with an optional grouped end-of-day summary. Reset check-ins use the same scheduled commitments and linked activity calculations as the Reset screen. Finishing, changing, deleting, pausing or disabling content removes its future reminders when the schedule is rebuilt. Journal reminders require opting into a daily time; workouts and general finance check-ins do not generate unsolicited reminders.

Reset deletion is available in Life Reset → Resets → Programme details for active, scheduled, completed and other saved programmes. The confirmation removes the complete Reset document, including commitments, progress, photos and history references, and clears its selection. Deletion does not offer undo. Independent activity already recorded in Habits or Fitness stays in those areas.

## Background delivery setup

1. Apply `supabase/migrations/202610150001_notifications.sql`.
2. Use production account mode with the existing Supabase configuration and server-only `SUPABASE_SERVICE_ROLE_KEY`.
3. Generate a VAPID key pair with `npx web-push generate-vapid-keys`. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (a contact mailto URL) on the server. Keep this pair stable so subscriptions remain valid.
4. Set a long random `CRON_SECRET`. `vercel.json` schedules `/api/notifications/deliver` once per minute. This requires a hosting plan that supports minute-level jobs. Other hosts must invoke the same URL once per minute with `Authorization: Bearer <CRON_SECRET>`. Never place the secret in a URL.
5. Deploy over HTTPS, sign in and enable reminders in Settings. The browser permission prompt is shown only after the user's explicit action. On supported iOS devices, install to the Home Screen first.

Settings reports whether background delivery is available on the current device. Demo mode and unconfigured environments provide reminders while the app is running, with an explicit availability message. Do not describe these environments as supporting closed-app or locked-device delivery. The timer itself uses absolute deadlines and catches up after suspension regardless of notification availability. Web Push delivery is subject to device permission, platform delivery and connectivity; minute-level jobs can deliver a focus boundary up to roughly one minute after its deadline.

Platform references: [Web Push and service workers](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) and [Vercel cron authentication and scheduling](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## Delivery and privacy

The server derives due notifications from the latest saved workspace in each subscription's IANA time zone. No detached queue of future item text is kept. A database lease prevents overlapping jobs from sending the same reminder twice and permits retry after a transient push failure. Expired endpoints are deleted. The service worker resolves each pushed notification against current server data before displaying it, so a queued push for deleted/completed content is discarded. Push payloads contain a delivery capability and ID; item text is fetched only after validation. Capabilities must not be logged.

An IndexedDB claim shared by service workers and tabs prevents local/push duplicates. Visible notifications are closed when changed content or preferences invalidate them. Background delivery takes over from local polling once this device has subscribed. Disabling categories is saved with the workspace; disabling all reminders also disables the current device subscription. Logging out disables/unsubscribes the device and closes existing notifications. Other signed-in devices follow the saved category preferences after workspace sync. Offline edits must sync before the server can act on them.

Unshown reminders expire after 90 seconds. Already displayed reminders can remain for up to a day while their content is still relevant, and close when the app observes completion, deletion or changed plans. There is no multi-day overdue replay. Simultaneous reminders within each category are grouped. Notification clicks navigate an existing same-origin app window to the relevant task occurrence, Reset, focus plan, payment, goal editor or review form.

## Verification

Run `npm run typecheck`, `npm run test:focused`, `npm run test:notifications`, `node tests/pwa-worker.cjs`, `node tests/domain-three.cjs` and `npm run build`. `tests/reset-notifications-ui.cjs` exercises confirmation, persistent deletion, preferences, notification revalidation and deep links against a running demo server. The worker tests simulate push resolution and clicks without a push provider. Live locked-device delivery additionally needs the deployed migration, configured VAPID keys, minute-level scheduler, a real subscribed device and a successful Web Push send; it cannot be confirmed by a local demo run.
