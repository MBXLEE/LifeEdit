import type { FocusPlan } from "./life-domain";
import type { LifeData, Task } from "./life-store";
import { commitmentComplete, dayOfReset, dueOnDay } from "./reset-progress";
import { addDateDays, dateInZone, wallTime } from "./notification-time";
import { nextReviewDate } from "./refinements";

export type NotificationCategory = "focus" | "planner" | "overdue" | "resets" | "habits" | "journal" | "finance" | "goals" | "reviews";
export type NotificationSettings = {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  reminderTimes: { plannerLeadMinutes: number; plannerSummaryTime: string; resetTime: string; habitTime: string; journalTime: string; financeTime: string; reviewTime: string };
  permissionAsked: boolean;
};
export type ScheduledNotification = { id: string; category: NotificationCategory; title: string; body: string; at: number; url: string; expiresAt?: number };
export const defaultNotificationSettings = (): NotificationSettings => ({
  enabled: false,
  categories: { focus: true, planner: true, overdue: false, resets: true, habits: false, journal: false, finance: false, goals: false, reviews: false },
  reminderTimes: { plannerLeadMinutes: 15, plannerSummaryTime: "19:00", resetTime: "19:00", habitTime: "19:30", journalTime: "20:30", financeTime: "09:00", reviewTime: "18:00" },
  permissionAsked: false
});
export function notificationSettings(raw?: Partial<NotificationSettings>): NotificationSettings {
  const base = defaultNotificationSettings();
  return { ...base, ...raw, categories: { ...base.categories, ...raw?.categories }, reminderTimes: { ...base.reminderTimes, ...raw?.reminderTimes } };
}
export function taskOccursOn(task: Task, day: string) {
  if (!task.recurrence || task.recurrence === "none") return task.date === day;
  if (day < task.date || (task.recurrenceEnd && day > task.recurrenceEnd)) return false;
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return task.recurrence === "daily" || (task.recurrence === "weekdays" ? weekday > 0 && weekday < 6 : weekday === new Date(`${task.date}T12:00:00Z`).getUTCDay());
}
export function taskDoneOn(task: Task, day: string) {
  return task.recurrence && task.recurrence !== "none" ? Boolean(task.completedDates?.includes(day)) : task.done;
}
export function focusNotifications(plan: FocusPlan | null, now = Date.now()): ScheduledNotification[] {
  if (!plan) return [];
  const rows: ScheduledNotification[] = [];
  const append = (at: number, phase: "focus" | "break", completed: number) => {
    const final = phase === "focus" && completed >= plan.sessions;
    rows.push({ id: `focus:${plan.id}:${phase}:${completed}:${at}`, category: "focus", title: phase === "break" ? "Break complete" : final ? "Focus plan complete" : "Focus session complete", body: phase === "break" ? `Ready for your next ${plan.name} session?` : final ? `You finished your ${plan.name} plan. Take a moment to rest.` : `${plan.name} complete. Time for a break.`, at, expiresAt: at + 90_000, url: `/focus?session=${encodeURIComponent(plan.id)}` });
  };
  if (plan.lastTransitionAt && plan.lastPhase) append(plan.lastTransitionAt, plan.lastPhase, plan.completed);
  if (!plan.running || !plan.endsAt || plan.phase === "finished") return rows;
  let at = plan.endsAt, phase = plan.phase, completed = plan.completed;
  for (let i = 0; i < 64 && completed < plan.sessions; i++) {
    if (phase === "focus") completed++;
    append(at, phase, completed);
    if (completed >= plan.sessions) break;
    phase = phase === "focus" && plan.breakMinutes > 0 ? "break" : "focus";
    at += (phase === "focus" ? plan.focusMinutes : plan.breakMinutes) * 60_000;
  }
  return rows.filter(r => r.at >= now-90_000);
}
export function plannerNotifications(tasks: Task[], settings: NotificationSettings, now = Date.now(), timeZone?: string): ScheduledNotification[] {
  const rows: ScheduledNotification[] = [], today = dateInZone(now, timeZone);
  const lead = Math.max(0, Math.min(1440, Number(settings.reminderTimes.plannerLeadMinutes) || 0)) * 60_000;
  for (let offset = -1; offset <= 7; offset++) {
    const day = addDateDays(today, offset);
    const unfinished = [...new Map(tasks.map(t => [t.id, t])).values()].filter(t => taskOccursOn(t, day) && !taskDoneOn(t, day));
    if (settings.categories.planner) for (const task of unfinished) {
      if (task.kind === "todo" || !task.time) continue;
      const due = wallTime(day, task.time, timeZone);
      rows.push({ id: `planner:${task.id}:${day}`, category: "planner", title: lead ? "Coming up" : "Time for your plan", body: lead ? `Your “${task.title}” starts in ${Math.round(lead / 60_000)} minutes.` : `Your “${task.title}” is scheduled for now.`, at: due-lead, expiresAt: due-lead+90_000, url: `/planner?item=${encodeURIComponent(task.id)}&date=${day}` });
    }
    const at = wallTime(day, settings.reminderTimes.plannerSummaryTime, timeZone);
    const remaining = unfinished.filter(t => t.kind === "todo" || !t.time || wallTime(day,t.time,timeZone) < at);
    if (settings.categories.overdue && remaining.length) rows.push({ id: `planner:summary:${day}`, category: "overdue", title: "A little room to finish", body: `You still have ${remaining.length} ${remaining.length === 1 ? "thing" : "things"} planned for today. Choose what still matters.`, at, url: `/planner?date=${day}` });
  }
  return rows.filter(r => Number.isFinite(r.at));
}
export function resetNotifications(data: LifeData, settings: NotificationSettings, now = Date.now(), timeZone?: string): ScheduledNotification[] {
  if (!settings.categories.resets) return [];
  const rows: ScheduledNotification[] = [], today = dateInZone(now, timeZone);
  for (const reset of data.lifeResets ?? []) {
    const url = `/life-reset?reset=${encodeURIComponent(reset.id)}`;
    if (reset.status === "completed") {
      if (reset.completedAt) rows.push({ id: `reset:${reset.id}:completed:${reset.completedAt}`, category: "resets", title: "Your Reset is complete", body: `You finished ${reset.name}. Make space to reflect on this season.`, at: Date.parse(reset.completedAt), expiresAt: Date.parse(reset.completedAt)+90_000, url });
      continue;
    }
    if (reset.status !== "active" && reset.status !== "scheduled") continue;
    for (let offset = -1; offset <= 1; offset++) {
      const day = addDateDays(today,offset);
      if (day < reset.startDate || day > reset.endDate) continue;
      const due = reset.commitments.filter(c => dueOnDay(reset,c,day));
      const remaining = due.filter(c => !commitmentComplete(data,reset,c,day));
      const number = dayOfReset(reset,day), halfway = number === Math.ceil(reset.duration/2);
      if (!remaining.length && !halfway) continue;
      rows.push({ id: `reset:${reset.id}:${reset.startDate}:${day}`, category: "resets", title: halfway ? `Halfway through ${reset.name}` : `${reset.name} check-in`, body: `Day ${number} of ${reset.duration}. ${remaining.length ? `${due.length-remaining.length} of ${due.length} commitments complete. There’s room for one small step.` : "Today’s commitments are complete. Notice how far you’ve come."}`, at: wallTime(day,settings.reminderTimes.resetTime,timeZone), url });
    }
  }
  return rows;
}
export function wellbeingNotifications(data: LifeData, settings: NotificationSettings, now = Date.now(), timeZone?: string): ScheduledNotification[] {
  const today = dateInZone(now,timeZone), rows: ScheduledNotification[] = [];
  for (let offset = -1; offset <= 1; offset++) {
    const day = addDateDays(today,offset);
    const habits = (data.habits ?? []).filter(h => h.direction === "build" && h.start <= day && !h.dates.includes(day));
    if (settings.categories.habits && habits.length) rows.push({ id: `habits:${day}`, category: "habits", title: "Your habit check-in", body: habits.length === 1 ? `Make a little space for “${habits[0].name}”.` : `${habits.length} habits are waiting for a check-in today.`, at: wallTime(day,settings.reminderTimes.habitTime,timeZone), url: "/habits" });
    if (settings.categories.journal && !(data.journals ?? []).some(j => j.date === day)) rows.push({ id: `journal:${day}`, category: "journal", title: "A moment to reflect", body: "Your chosen time for a few quiet lines.", at: wallTime(day,settings.reminderTimes.journalTime,timeZone), url: "/journal" });
    if (settings.categories.finance) for (const t of data.transactions ?? []) {
      if (!t.dueDate || t.dueDate !== day || t.paid || t.status === "Paid") continue;
      rows.push({ id: `finance:${t.id}:${day}`, category: "finance", title: "Planned payment today", body: `“${t.title}” is due today.`, at: wallTime(day,settings.reminderTimes.financeTime,timeZone), url: `/finance?item=${encodeURIComponent(t.id)}` });
    }
  }
  if (settings.categories.goals) for (const g of data.goals ?? []) {
    if (!g.due || g.archived || g.progress >= 100) continue;
    rows.push({ id: `goal:${g.id}:${g.due}`, category: "goals", title: "A goal you planned for today", body: `“${g.title}” reaches its planned date today.`, at: wallTime(g.due,"09:00",timeZone), url: `/life-edit?goal=${encodeURIComponent(g.id)}` });
  }
  if (settings.categories.reviews && data.reviewSchedule?.enabled) {
    const last = (data.reviews ?? []).map(r => r.date).sort().at(-1) ?? data.reviewSchedule.start;
    const due = last ? nextReviewDate(last,data.reviewSchedule.frequency) : "";
    if (due) rows.push({ id: `review:${due}`, category: "reviews", title: "Space for your life review", body: `Your ${data.reviewSchedule.frequency.toLowerCase()} review is planned for today.`, at: wallTime(due,settings.reminderTimes.reviewTime,timeZone), url: "/insights?review=new" });
  }
  return rows;
}
export function buildNotificationSchedule(data: LifeData, now = Date.now(), timeZone?: string) {
  const settings = notificationSettings(data.notificationSettings);
  if (!settings.enabled) return [];
  const rows = [...(settings.categories.focus ? focusNotifications(data.focusPlan,now) : []), ...plannerNotifications(data.tasks ?? [],settings,now,timeZone), ...resetNotifications(data,settings,now,timeZone), ...wellbeingNotifications(data,settings,now,timeZone)];
  const unique = [...new Map(rows.filter(r => Number.isFinite(r.at) && (r.expiresAt ?? r.at+90_000) > now && r.at < now+8*86400_000).map(r => [r.id,{ ...r, expiresAt: r.expiresAt ?? r.at+90_000 }])).values()];
  const buckets = new Map<string,ScheduledNotification[]>();
  for (const item of unique) {
    const key = item.category === "focus" ? item.id : `${item.category}:${Math.floor(item.at/60_000)}`;
    buckets.set(key,[...(buckets.get(key) ?? []),item]);
  }
  return [...buckets.entries()].map(([key,items]) => {
    if (items.length === 1) return items[0];
    const first = items[0];
    const url = first.category === "planner" ? `/planner?date=${dateInZone(first.at,timeZone)}` : first.category === "resets" ? "/life-reset?view=resets" : first.category === "goals" ? "/life-edit?view=goals" : "/finance?view=transactions";
    return { ...first, id:`group:${key}`, title:first.category === "planner" ? `${items.length} plans coming up` : first.category === "resets" ? "Your Reset check-in" : `${items.length} reminders for today`, body:items.slice(0,3).map(n => n.body).join(" ") + (items.length > 3 ? ` And ${items.length-3} more.` : ""), url };
  }).sort((a,b) => a.at-b.at);
}
