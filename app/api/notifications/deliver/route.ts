import webPush from "web-push";
import { timingSafeEqual } from "node:crypto";
import { notificationAdmin, pushConfigured } from "@/lib/notification-server";
import { buildNotificationSchedule } from "@/lib/notifications";
import type { LifeData } from "@/lib/life-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`, actual = request.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || actual.length !== expected.length || !timingSafeEqual(Buffer.from(actual),Buffer.from(expected))) return new Response(null,{status:401});
  if (!pushConfigured()) return Response.json({error:"Push is not configured."},{status:503});
  const db = notificationAdmin(), now = Date.now();
  webPush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
  let sent = 0, failed = 0;
  // Keyset pagination avoids silently dropping users as the subscription table grows.
  let after = "";
  while (true) {
    let query = db.from("notification_devices").select("id,user_id,subscription,time_zone,delivery_token").eq("enabled",true).order("id").limit(100);
    if (after) query = query.gt("id",after);
    const {data:devices,error} = await query;
    if (error) return Response.json({error:"Could not read notification devices."},{status:503});
    if (!devices?.length) break;
    for (const device of devices) {
      const {data:workspace,error:readError} = await db.from("life_workspaces").select("data").eq("user_id",device.user_id).maybeSingle();
      if (readError) { failed++; continue; }
      if (!workspace) continue;
      const due = buildNotificationSchedule(workspace.data as LifeData,now,device.time_zone).filter(item => item.at <= now && (item.expiresAt ?? 0) > now);
      // If a suspended focus sequence has crossed several boundaries, show only the latest.
      const latestFocus = due.filter(n => n.category === "focus").at(-1);
      for (const item of due.filter(n => n.category !== "focus" || n.id === latestFocus?.id)) {
        const {data:claimed,error:claimError} = await db.rpc("claim_notification",{device:device.id,notification:item.id});
        if (claimError) { failed++; continue; }
        if (!claimed) continue;
        try {
          await webPush.sendNotification(device.subscription,JSON.stringify({id:item.id,device:device.id,token:device.delivery_token}),{TTL:60,urgency:item.category === "focus" ? "high" : "normal",timeout:10_000});
          await db.from("notification_deliveries").update({sent_at:new Date().toISOString()}).eq("device_id",device.id).eq("notification_id",item.id);
          sent++;
        } catch (e) {
          if ([404,410].includes((e as {statusCode?:number}).statusCode ?? 0)) await db.from("notification_devices").delete().eq("id",device.id);
          failed++;
        }
      }
    }
    after = devices.at(-1)!.id;
  }
  await db.from("notification_deliveries").delete().lt("claimed_at",new Date(now-35*86400_000).toISOString());
  return Response.json({sent,failed},{status:failed ? 503 : 200});
}
