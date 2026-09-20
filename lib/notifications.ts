import type { FocusPlan } from "@/lib/life-domain";
import type { LifeData, Task } from "@/lib/life-store";

export type NotificationCategory = "focus" | "planner" | "overdue" | "habits" | "workouts" | "journal" | "finance" | "spiritual" | "goals";

export type NotificationSettings = {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  reminderTimes: {
    plannerLeadMinutes: number;
    habitTime: string;
    journalTime: string;
    financeTime: string;
    spiritualTime: string;
  };
  permissionAsked: boolean;
};

export type ScheduledNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  at: number;
  url: string;
};

export const defaultNotificationSettings = (): NotificationSettings => ({
  enabled: false,
  categories: {
    focus: true,
    planner: true,
    overdue: false,
    habits: false,
    workouts: false,
    journal: false,
    finance: false,
    spiritual: false,
    goals: false
  },
  reminderTimes: {
    plannerLeadMinutes: 15,
    habitTime: "19:00",
    journalTime: "20:30",
    financeTime: "17:30",
    spiritualTime: "07:30"
  },
  permissionAsked: false
});

function combineDateTime(date: string, time = "09:00") {
  const parsed = new Date(`${date}T${time || "09:00"}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function dailyTime(date: Date, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hour || 0, minute || 0, 0, 0);
  if (next.getTime() <= date.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

export function focusNotifications(plan: FocusPlan | null, now = Date.now()): ScheduledNotification[] {
  if (!plan?.running || !plan.endsAt || plan.phase === "finished" || plan.endsAt <= now) return [];
  const isFinalFocus = plan.phase === "focus" && plan.completed + 1 >= plan.sessions;
  const nextReadyAt = plan.phase === "break" ? plan.endsAt : plan.endsAt + plan.breakMinutes * 60 * 1000;
  const rows: ScheduledNotification[] = [{
    id: `focus:${plan.id}:${plan.phase}:${plan.completed}:${plan.endsAt}`,
    category: "focus",
    title: plan.phase === "break" ? "Break completed" : isFinalFocus ? "All planned sessions completed" : "Focus session completed",
    body: plan.phase === "break" ? "Your next focus session is ready." : isFinalFocus ? "Beautiful work. Your focus plan is complete." : "Take a gentle break before the next round.",
    at: plan.endsAt,
    url: "/focus"
  }];
  if (plan.phase === "focus" && !isFinalFocus && plan.breakMinutes > 0) {
    rows.push({ id: `focus:${plan.id}:break-start:${plan.completed}:${plan.endsAt}`, category: "focus", title: "Break started", body: "Step away for a moment and reset.", at: plan.endsAt + 1000, url: "/focus" });
    rows.push({ id: `focus:${plan.id}:next-ready:${plan.completed}:${nextReadyAt}`, category: "focus", title: "Next focus session ready", body: "Your next planned session is ready when you are.", at: nextReadyAt, url: "/focus" });
  }
  return rows;
}

export function plannerNotifications(tasks: Task[], settings: NotificationSettings, now = Date.now()): ScheduledNotification[] {
  const lead = Math.max(0, settings.reminderTimes.plannerLeadMinutes) * 60 * 1000;
  return tasks.flatMap(task => {
    if (task.done) return [];
    const due = combineDateTime(task.date, task.time);
    if (!due) return [];
    const rows: ScheduledNotification[] = [];
    const upcoming = due - lead;
    if (upcoming > now) rows.push({ id: `planner:${task.id}:upcoming:${due}:${lead}`, category: "planner", title: "Upcoming time block", body: `${task.title} starts at ${task.time}.`, at: upcoming, url: `/planner?item=${task.id}` });
    if (due > now) rows.push({ id: `planner:${task.id}:due:${due}`, category: "planner", title: "Task due now", body: task.title, at: due, url: `/planner?item=${task.id}` });
    if (settings.categories.overdue && due + 30 * 60 * 1000 > now && due < now) rows.push({ id: `planner:${task.id}:overdue:${due}`, category: "overdue", title: "Overdue task", body: `${task.title} is still waiting for you.`, at: now + 5000, url: `/planner?item=${task.id}` });
    return rows;
  });
}

export function wellbeingNotifications(data: LifeData, settings: NotificationSettings, now = Date.now()): ScheduledNotification[] {
  const today = new Date(now);
  const rows: ScheduledNotification[] = [];
  if (settings.categories.habits && data.habits.some(h => h.direction === "build")) rows.push({ id: `habits:daily:${today.toDateString()}`, category: "habits", title: "Habit check-in", body: "Take a moment to mark today’s small promises.", at: dailyTime(today, settings.reminderTimes.habitTime), url: "/habits" });
  if (settings.categories.workouts && data.workouts.some(w => !w.archived)) rows.push({ id: `workouts:daily:${today.toDateString()}`, category: "workouts", title: "Workout plan", body: "Your movement plan is ready when you are.", at: dailyTime(today, settings.reminderTimes.habitTime), url: "/fitness" });
  if (settings.categories.journal) rows.push({ id: `journal:daily:${today.toDateString()}`, category: "journal", title: "Reflection time", body: "A few quiet lines can help you close the day.", at: dailyTime(today, settings.reminderTimes.journalTime), url: "/journal" });
  if (settings.categories.finance) rows.push({ id: `finance:daily:${today.toDateString()}`, category: "finance", title: "Financial check-in", body: "Review today’s spending while it is still fresh.", at: dailyTime(today, settings.reminderTimes.financeTime), url: "/finance" });
  if (settings.categories.spiritual) rows.push({ id: `spiritual:daily:${today.toDateString()}`, category: "spiritual", title: "Spiritual routine", body: "Make space for prayer, study, or reflection.", at: dailyTime(today, settings.reminderTimes.spiritualTime), url: "/spiritual" });
  if (settings.categories.goals) {
    data.goals.filter(goal => !goal.archived && goal.due).forEach(goal => {
      const at = combineDateTime(goal.due, "09:00");
      if (at && at > now) rows.push({ id: `goals:${goal.id}:${goal.due}`, category: "goals", title: "Goal milestone", body: goal.title, at, url: "/life-edit" });
    });
  }
  return rows;
}

export function buildNotificationSchedule(data: LifeData, now = Date.now()) {
  const settings = data.notificationSettings ?? defaultNotificationSettings();
  if (!settings.enabled) return [];
  return [
    ...(settings.categories.focus ? focusNotifications(data.focusPlan, now) : []),
    ...(settings.categories.planner || settings.categories.overdue ? plannerNotifications(data.tasks, settings, now) : []),
    ...wellbeingNotifications(data, settings, now)
  ].filter(item => item.at > now).sort((a, b) => a.at - b.at);
}
