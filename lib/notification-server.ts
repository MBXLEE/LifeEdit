import { createClient } from "@supabase/supabase-js";
import { isDemoMode } from "./app-mode";

export function pushConfigured() {
  return !isDemoMode && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT && process.env.CRON_SECRET);
}
export function notificationAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
// Push endpoints must not be allowed to turn the server into an arbitrary fetch proxy.
export function validPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (url.hostname === "fcm.googleapis.com" || url.hostname === "updates.push.services.mozilla.com" || url.hostname === "web.push.apple.com" || url.hostname.endsWith(".push.apple.com") || url.hostname === "wns2-par02p.notify.windows.com" || url.hostname.endsWith(".notify.windows.com"));
  } catch { return false; }
}
