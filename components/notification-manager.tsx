"use client";

import { useEffect, useMemo, useRef } from "react";
import { buildNotificationSchedule, type ScheduledNotification } from "@/lib/notifications";
import { useLife } from "@/lib/life-store";

const deliveredKey = "life-edit-notifications-delivered-v1";
const maxDelay = 2 ** 31 - 1;

function supported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function deliveredIds() {
  try { return new Set(JSON.parse(localStorage.getItem(deliveredKey) ?? "[]") as string[]); }
  catch { return new Set<string>(); }
}

function rememberDelivered(id: string) {
  const next = deliveredIds();
  next.add(id);
  localStorage.setItem(deliveredKey, JSON.stringify([...next].slice(-250)));
}

async function showNotification(item: ScheduledNotification) {
  if (!supported() || Notification.permission !== "granted" || deliveredIds().has(item.id)) return;
  rememberDelivered(item.id);
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  const options: NotificationOptions = { body: item.body, tag: item.id, data: { url: item.url }, icon: "/icon-192.png", badge: "/maskable-icon-512.png" };
  if (registration) await registration.showNotification(item.title, options);
  else {
    const notification = new Notification(item.title, options);
    notification.onclick = () => { window.focus(); window.location.assign(item.url); notification.close(); };
  }
}

export function NotificationManager() {
  const { data, ready } = useLife();
  const timers = useRef<number[]>([]);
  const schedule = useMemo(() => ready ? buildNotificationSchedule(data).slice(0, 40) : [], [data, ready]);

  useEffect(() => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
    if (!ready || !data.notificationSettings.enabled || !supported() || Notification.permission !== "granted") return;
    const delivered = deliveredIds();
    for (const item of schedule) {
      if (delivered.has(item.id)) continue;
      const delay = item.at - Date.now();
      if (delay < -60_000) continue;
      timers.current.push(window.setTimeout(() => { void showNotification(item); }, Math.max(0, Math.min(delay, maxDelay))));
    }
    return () => {
      timers.current.forEach(timer => window.clearTimeout(timer));
      timers.current = [];
    };
  }, [data.notificationSettings.enabled, ready, schedule]);

  return null;
}

export async function requestNotificationPermission() {
  if (!supported()) return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  return Notification.requestPermission();
}
