import { APP_MODE } from "@/lib/app-mode";
import { workerSource } from "@/lib/pwa-worker";

import { notificationWorkerSource } from "@/lib/notification-worker";

export const dynamic = "force-static";
export function GET() {
  return new Response(`const MODE = ${JSON.stringify(APP_MODE)}; const VERSION = ${JSON.stringify(process.env.NEXT_PUBLIC_PWA_VERSION)};\n${workerSource}
${notificationWorkerSource}`, {
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache", "Service-Worker-Allowed": "/" },
  });
}
