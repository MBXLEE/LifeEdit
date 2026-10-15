import { createClient } from "@/lib/supabase/server";
import { pushConfigured, sameOrigin, validPushEndpoint } from "@/lib/notification-server";

export async function GET() {
  return Response.json({ available: pushConfigured(), publicKey: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null,{status:403});
  if (!pushConfigured()) return Response.json({ error: "Background delivery is not configured." },{status:503});
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new Response(null,{status:401});
  try {
    if (Number(request.headers.get("content-length")) > 16_384) return new Response(null,{status:413});
    const { subscription, timeZone, enabled } = await request.json();
    if (!subscription || typeof subscription.endpoint !== "string" || !validPushEndpoint(subscription.endpoint) || typeof subscription.keys?.p256dh !== "string" || typeof subscription.keys?.auth !== "string" || JSON.stringify(subscription).length > 8192 || typeof timeZone !== "string" || typeof enabled !== "boolean") return new Response(null,{status:400});
    new Intl.DateTimeFormat("en",{timeZone}).format();
    const { error } = await db.from("notification_devices").upsert({ user_id:user.id, endpoint:subscription.endpoint, subscription, time_zone:timeZone, enabled, updated_at:new Date().toISOString() },{onConflict:"endpoint"});
    if (error) return Response.json({error:"Could not save this device."},{status:503});
    return Response.json({ok:true});
  } catch { return new Response(null,{status:400}); }
}
