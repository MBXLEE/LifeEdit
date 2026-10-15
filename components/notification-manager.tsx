"use client";
import { useEffect, useRef } from "react";
import { buildNotificationSchedule, type ScheduledNotification } from "@/lib/notifications";
import { useLife } from "@/lib/life-store";

export type DeliveryStatus = "background" | "open" | "blocked" | "unsupported" | "off";
export const deliveryStatusEvent = "life-edit-notification-status";
const supported = () => typeof window !== "undefined" && "Notification" in window;
export async function requestNotificationPermission() {
  if (!supported()) return "unsupported" as const;
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}
export async function disconnectBackgroundNotifications() {
  await connectBackgroundNotifications(false);
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({type:"NOTIFICATION_PREFERENCES",settings:{enabled:false,categories:{}},ids:[]});
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
}
export async function connectBackgroundNotifications(enabled: boolean): Promise<DeliveryStatus> {
  if (!supported()) return "unsupported";
  const permitted = Notification.permission === "granted";
  const status = !enabled ? "off" : !permitted ? "blocked" : "open";
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return status;
  try {
    const configResponse = await fetch("/api/notifications/subscription",{cache:"no-store"});
    if (!configResponse.ok) return status;
    const config = await configResponse.json();
    if (!config.available || !("PushManager" in window)) return status;
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && enabled && permitted) {
      const bytes = Uint8Array.from(atob(config.publicKey.replace(/-/g,"+").replace(/_/g,"/")),c => c.charCodeAt(0));
      subscription = await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
    }
    if (!subscription) return status;
    const response = await fetch("/api/notifications/subscription",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:subscription.toJSON(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,enabled:enabled && permitted})});
    return response.ok && enabled && permitted ? "background" : status;
  } catch { return status; }
}
async function showLocal(item: ScheduledNotification) {
  if (!supported() || Notification.permission !== "granted") return;
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  const worker = registration?.active;
  if (worker) {
    await new Promise<void>((resolve,reject) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => { channel.port1.close(); reject(new Error("Reminder worker timed out")); },5000);
      channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); if (event.data?.ok) resolve(); else reject(new Error("Reminder unavailable")); };
      worker.postMessage({type:"SHOW_REMINDER",item},[channel.port2]);
    });
    return;
  }
  const show = async () => {
    const key = "life-edit-notifications-delivered-v2";
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { /* Storage is optional. */ }
    if (ids.includes(item.id)) return;
    const notification = new Notification(item.title,{body:item.body,tag:item.id,data:{url:item.url},icon:"/icon-192.png"});
    notification.onclick = () => { window.focus(); window.location.assign(item.url); notification.close(); };
    try { localStorage.setItem(key,JSON.stringify([...ids,item.id].slice(-1000))); } catch { /* Keep the in-memory claim. */ }
  };
  if (navigator.locks) await navigator.locks.request("life-edit-reminder",show);
  else await show();
}
export function NotificationManager() {
  const { data, ready } = useLife();
  const latest = useRef(data); latest.current = data;
  const delivery = useRef<DeliveryStatus>("off");
  const attempted = useRef(new Set<string>());
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const refresh = async () => {
      const result = await connectBackgroundNotifications(latest.current.notificationSettings.enabled);
      if (!alive) return;
      delivery.current = result;
      window.dispatchEvent(new CustomEvent(deliveryStatusEvent,{detail:result}));
    };
    void refresh();
    const interval = window.setInterval(refresh,60_000);
    const report = () => window.dispatchEvent(new CustomEvent(deliveryStatusEvent,{detail:delivery.current}));
    window.addEventListener("life-edit-request-notification-status",report);
    window.addEventListener("focus",refresh);
    return () => { alive = false; clearInterval(interval); window.removeEventListener("focus",refresh); window.removeEventListener("life-edit-request-notification-status",report); };
  },[ready,data.notificationSettings.enabled]);
  useEffect(() => {
    if (!ready || !("serviceWorker" in navigator)) return;
    const reconcile = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) return;
      const current = latest.current, now = Date.now();
      const visible = await registration.getNotifications();
      const keepIds = visible.filter(n => {
        const item = n.data?.item as ScheduledNotification | undefined;
        return item && now-item.at < 86400_000 && buildNotificationSchedule(current,item.at).some(candidate => candidate.id === item.id && candidate.at === item.at);
      }).map(n => n.data.id);
      registration.active.postMessage({type:"NOTIFICATION_PREFERENCES",settings:current.notificationSettings,ids:buildNotificationSchedule(current).map(n => n.id),keepIds});
    };
    void reconcile().catch(() => {});
    const timer = window.setInterval(() => void reconcile().catch(() => {}),60_000);
    return () => clearInterval(timer);
  },[data,ready]);
  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const tick = async () => {
      if (busy || delivery.current === "background" || !supported() || Notification.permission !== "granted") return;
      busy = true;
      try {
        const now = Date.now();
        const due = buildNotificationSchedule(latest.current,now).filter(n => n.at <= now && (n.expiresAt ?? 0) > now);
        const focus = due.filter(n => n.category === "focus").at(-1);
        for (const item of due.filter(n => n.category !== "focus" || n.id === focus?.id)) {
          if (attempted.current.has(item.id)) continue;
          await showLocal(item);
          attempted.current.add(item.id);
        }
      } catch { /* Retry on the next tick without interrupting the workspace. */ }
      finally { busy = false; }
    };
    void tick();
    const timer = window.setInterval(tick,1000);
    window.addEventListener("focus",tick);
    document.addEventListener("visibilitychange",tick);
    return () => { clearInterval(timer); window.removeEventListener("focus",tick); document.removeEventListener("visibilitychange",tick); };
  },[ready]);
  return null;
}
