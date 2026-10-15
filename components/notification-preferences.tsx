"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useLife } from "@/lib/life-store";
import type { NotificationCategory, NotificationSettings } from "@/lib/notifications";
import { connectBackgroundNotifications, deliveryStatusEvent, requestNotificationPermission, type DeliveryStatus } from "./notification-manager";
import { Button, Card, Field } from "./workspace-ui";

const categories: [NotificationCategory,string,string][] = [
  ["planner","Planner & Tasks","One reminder for each scheduled activity."],
  ["overdue","End-of-day summary","One gentle summary when today’s plans are unfinished."],
  ["resets","Resets","A daily check-in, a halfway reflection and completion."],
  ["focus","Focus Sessions","When focus sessions, breaks and your plan finish."],
  ["habits","Habits","A daily check-in for habits you haven’t marked complete."],
  ["goals","Goals","A reminder on a goal’s chosen deadline."],
  ["finance","Finance reminders","Payments with a due date that you haven’t marked paid."],
  ["journal","Journal reminders","Choose a daily time to reflect. Skip days you’ve written."],
  ["reviews","Life Reviews","Your scheduled review, when a review schedule is set."]
];
export function NotificationPreferences() {
  const {data,update} = useLife();
  const settings = data.notificationSettings;
  const [permission,setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [delivery,setDelivery] = useState<DeliveryStatus>("off");
  const [busy,setBusy] = useState(false), [notice,setNotice] = useState("");
  useEffect(() => {
    const refresh = () => setPermission("Notification" in window ? Notification.permission : "unsupported");
    const status = (event: Event) => { setDelivery((event as CustomEvent<DeliveryStatus>).detail); refresh(); };
    refresh();
    window.addEventListener("focus",refresh); window.addEventListener(deliveryStatusEvent,status);
    window.dispatchEvent(new Event("life-edit-request-notification-status"));
    return () => { window.removeEventListener("focus",refresh); window.removeEventListener(deliveryStatusEvent,status); };
  },[]);
  function category(key: NotificationCategory, enabled: boolean) {
    update(d => ({...d,notificationSettings:{...d.notificationSettings,categories:{...d.notificationSettings.categories,[key]:enabled}}}));
  }
  function time(key: keyof NotificationSettings["reminderTimes"], value: string | number) {
    if (value === "") return;
    update(d => ({...d,notificationSettings:{...d.notificationSettings,reminderTimes:{...d.notificationSettings.reminderTimes,[key]:value}}}));
  }
  async function enable() {
    setBusy(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      update(d => ({...d,notificationSettings:{...d.notificationSettings,enabled:result === "granted",permissionAsked:true}}));
      if (result === "granted") { setDelivery(await connectBackgroundNotifications(true)); setNotice("Your chosen reminders are enabled."); }
      else setNotice(result === "default" ? "No changes made. You can enable reminders whenever you’re ready." : "You can manage notification access in your browser’s site settings.");
    } finally { setBusy(false); }
  }
  return <Card className="mt-8 le-notification-preferences"><div className="le-row"><div><p className="le-eyebrow">Notifications</p><h2>A little support for what matters.</h2><p className="le-muted mt-3">Reminders follow the plans you create. Choose what you’d like to hear about.</p></div>{!settings.enabled && <Button disabled={busy || permission === "denied" || permission === "unsupported"} onClick={() => void enable()}><Bell size={16}/>{busy ? "Enabling…" : "Enable reminders"}</Button>}</div>
    <p className="le-muted my-5" role="status">{permission === "unsupported" ? "Notifications aren’t available in this browser. On iPhone or iPad, try adding Life Edit to your Home Screen and opening it there." : permission === "denied" ? "Notifications are blocked. To enable them, change Life Edit’s permission in your browser’s site settings." : settings.enabled ? delivery === "background" ? "Reminders are ready on this device, including when you step away from the app." : "Keep Life Edit open for reminders on this device. Background delivery isn’t available in this workspace." : "Notifications are off. Your preferences below are saved for when you enable them."}</p>
    <label className="le-check-row"><input type="checkbox" checked={settings.enabled} disabled={permission !== "granted"} onChange={e => update(d => ({...d,notificationSettings:{...d.notificationSettings,enabled:e.target.checked}}))}/>Allow reminders</label>
    <div className="le-notification-categories mt-5">{categories.map(([key,label,description]) => <label key={key} className="le-notification-option"><input type="checkbox" checked={settings.categories[key]} onChange={e => category(key,e.target.checked)}/><span><strong>{label}</strong><small>{description}</small></span></label>)}</div>
    <div className="le-grid-three le-reminder-grid mt-5">
      {settings.categories.planner && <Field label="Task reminder"><select value={settings.reminderTimes.plannerLeadMinutes} onChange={e => time("plannerLeadMinutes",Number(e.target.value))}>{[...new Set([0,5,15,30,60,settings.reminderTimes.plannerLeadMinutes])].sort((a,b) => a-b).map(n => <option key={n} value={n}>{n ? `${n} minutes before` : "At the scheduled time"}</option>)}</select></Field>}
      {([["overdue","plannerSummaryTime","End-of-day summary"],["resets","resetTime","Reset check-in"],["habits","habitTime","Habit check-in"],["journal","journalTime","Journal time"],["finance","financeTime","Payment reminder"],["reviews","reviewTime","Life review time"]] as const).map(([key,field,label]) => settings.categories[key] && <Field key={field} label={label}><input type="time" value={settings.reminderTimes[field]} onChange={e => time(field,e.target.value)}/></Field>)}
    </div><p className="le-muted mt-5">Times follow this device’s time zone. Completed items are skipped. Unfinished tasks receive at most one summary per day.</p>{notice && <p role="status" className="mt-4">{notice}</p>}
  </Card>;
}
