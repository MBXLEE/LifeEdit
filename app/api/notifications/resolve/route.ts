import { notificationAdmin, pushConfigured } from "@/lib/notification-server";
import { buildNotificationSchedule } from "@/lib/notifications";
import type { LifeData } from "@/lib/life-store";

// A single-delivery capability lets a woken worker revalidate current content,
// even when the user's page is closed and its auth session needs refreshing.
export async function POST(request: Request) {
  if (!pushConfigured()) return new Response(null,{status:503});
  try {
    const {device,token,id} = await request.json();
    if (typeof device !== "string" || typeof token !== "string" || typeof id !== "string" || id.length > 500) return new Response(null,{status:400});
    const db = notificationAdmin();
    const {data:row} = await db.from("notification_devices").select("user_id,time_zone").eq("id",device).eq("delivery_token",token).eq("enabled",true).maybeSingle();
    if (!row) return new Response(null,{status:404});
    const {data:claim} = await db.from("notification_deliveries").select("notification_id").eq("device_id",device).eq("notification_id",id).maybeSingle();
    if (!claim) return new Response(null,{status:404});
    const {data:workspace} = await db.from("life_workspaces").select("data").eq("user_id",row.user_id).maybeSingle();
    const now = Date.now();
    const item = workspace && buildNotificationSchedule(workspace.data as LifeData,now,row.time_zone).find(n => n.id === id && n.at <= now && (n.expiresAt ?? 0) > now);
    return item ? Response.json(item,{headers:{"Cache-Control":"no-store"}}) : new Response(null,{status:404});
  } catch { return new Response(null,{status:400}); }
}
