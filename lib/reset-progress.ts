import type { LifeData, LifeResetProgram, ResetStatus, ResetCommitment, ResetActivity } from "./life-store";
const dayMs = 86_400_000;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function today() { return isoDate(new Date()); }
export function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function parseDate(value: string) { return new Date(`${value}T12:00:00`); }
export function addDays(value: string, amount: number) { const date = parseDate(value); date.setDate(date.getDate() + amount); return isoDate(date); }
export function daysBetween(start: string, end: string) { return Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / dayMs); }
export function inclusiveDays(start: string, end: string) { return Math.max(0, daysBetween(start, end) + 1); }
export function formatDate(value: string) { return parseDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
export function allowanceFor(duration: number) { return Math.max(1, Math.round(duration / 21)); }
export function endDate(start: string, duration: number) { return addDays(start, Math.max(1, duration) - 1); }
export function statusFor(reset: LifeResetProgram, date = today()): ResetStatus {
  if (["completed", "failed", "abandoned", "draft"].includes(reset.status)) return reset.status;
  if (date < reset.startDate) return "scheduled";
  if (date > reset.endDate) return reset.status === "scheduled" ? "active" : reset.status;
  return "active";
}
export function dayOfReset(reset: LifeResetProgram, date = today()) {
  if (date < reset.startDate) return 0;
  return Math.min(reset.duration, Math.max(1, inclusiveDays(reset.startDate, date)));
}
export function progressFor(reset: LifeResetProgram, date = today()) {
  if (reset.status === "completed") return 100;
  if (date < reset.startDate) return 0;
  return Math.min(100, Math.round(dayOfReset(reset, date) / reset.duration * 100));
}
export function weekStart(value: string) { const d = parseDate(value); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoDate(d); }
export function weekEnd(value: string) { return addDays(weekStart(value), 6); }
export function windowKey(commitment: ResetCommitment, start: string, end = start) { return `${commitment.id}:${start}:${end}`; }
export function commitmentSummary(commitment: ResetCommitment) {
  if (commitment.type === "daily") return "Every day";
  if (commitment.type === "specific-days") return `On ${commitment.scheduleDays?.map(day => dayNames[day]).join(", ") || "selected days"}`;
  if (commitment.type === "weekly-quantity") return `${commitment.targetPerWeek ?? 1}x per week`;
  if (commitment.type === "weekly-recurring") return `Weekly${commitment.scheduleDays?.length ? ` on ${commitment.scheduleDays.map(day => dayNames[day]).join(", ")}` : ""}`;
  if (commitment.type === "avoidance") return "Avoidance commitment";
  if (commitment.type === "limit") return `Limit ${commitment.limitAmount ?? ""} ${commitment.limitUnit ?? ""}`.trim();
  return commitment.everyNDays ? `Every ${commitment.everyNDays} days` : "Progress photo";
}
export function dueOnDay(reset: LifeResetProgram, commitment: ResetCommitment, date: string) {
  const day = parseDate(date).getDay();
  const resetDay = dayOfReset(reset, date);
  if (date < reset.startDate || date > reset.endDate) return false;
  if (commitment.type === "daily" || commitment.type === "avoidance" || commitment.type === "limit") return true;
  if (commitment.type === "specific-days") return Boolean(commitment.scheduleDays?.includes(day));
  if (commitment.type === "weekly-recurring") return Boolean(commitment.scheduleDays?.includes(day) ?? day === 0);
  if (commitment.type === "weekly-quantity") return true;
  if (commitment.type === "photo") return resetDay === 1 || resetDay === reset.duration || Boolean(commitment.everyNDays && resetDay % commitment.everyNDays === 0);
  return false;
}
export function resetDateRange(reset: LifeResetProgram, through = today()) {
  const end = through < reset.endDate ? through : reset.endDate;
  const count = inclusiveDays(reset.startDate, end);
  return Array.from({ length: count }, (_, index) => addDays(reset.startDate, index));
}
export function syncedActivities(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment): ResetActivity[] {
  const start = reset.startDate, end = reset.endDate;
  const inRange = (date: string) => date >= start && date <= end;
  if (commitment.linkedFeature === "Fitness") {
    return data.workoutLogs.filter(log => inRange(log.date)).map(log => ({ id: `fitness-${log.id}`, commitmentId: commitment.id, date: log.date, source: "fitness", externalId: log.id, note: log.name }));
  }
  if (commitment.linkedFeature === "Habits") {
    const hint = (commitment.sourceHint || commitment.title).toLowerCase();
    return data.habits.filter(habit => habit.direction === "build" && (habit.name.toLowerCase().includes(hint) || hint.includes(habit.name.toLowerCase()))).flatMap(habit => habit.dates.filter(inRange).map(date => ({ id: `habit-${habit.id}-${date}`, commitmentId: commitment.id, date, source: "habit" as const, externalId: habit.id, note: habit.name })));
  }
  if (commitment.linkedFeature === "Journal") {
    return data.journals.filter(journal => inRange(journal.date)).map(journal => ({ id: `journal-${journal.id}`, commitmentId: commitment.id, date: journal.date, source: "journal", externalId: journal.id, note: journal.title }));
  }
  if (commitment.linkedFeature === "Spiritual") {
    return [...data.prayers.filter(row => inRange(row.date)).map(row => ({ id: `prayer-${row.id}`, commitmentId: commitment.id, date: row.date, source: "spiritual" as const, externalId: row.id, note: row.title })), ...data.studyPlans.filter(row => inRange(row.date)).map(row => ({ id: `study-${row.id}`, commitmentId: commitment.id, date: row.date, source: "spiritual" as const, externalId: row.id, note: row.title }))];
  }
  if (commitment.linkedFeature === "Planner") {
    return data.tasks.filter(task => task.done && inRange(task.date) && task.title.toLowerCase().includes(commitment.title.split(" ")[0].toLowerCase())).map(task => ({ id: `planner-${task.id}`, commitmentId: commitment.id, date: task.date, source: "planner", externalId: task.id, note: task.title }));
  }
  if (commitment.linkedFeature === "Focus") {
    return data.focus.filter(row => inRange(row.date)).map(row => ({ id: `focus-${row.id}`, commitmentId: commitment.id, date: row.date, source: "focus", externalId: row.id, note: row.name, value: row.seconds }));
  }
  return [];
}
export function allActivities(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment) {
  const manual = reset.activities.filter(activity => activity.commitmentId === commitment.id);
  const synced = syncedActivities(data, reset, commitment);
  const unique = new Map<string, ResetActivity>();
  [...manual, ...synced].forEach(activity => unique.set(`${activity.source}:${activity.externalId ?? activity.id}:${activity.date}`, activity));
  return [...unique.values()];
}
export function activityCountInWindow(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment, start: string, end = start) {
  if (commitment.type === "photo") return reset.photos.filter(photo => photo.date >= start && photo.date <= end).length;
  const dates = new Set(allActivities(data, reset, commitment).filter(activity => activity.date >= start && activity.date <= end).map(activity => activity.date));
  return dates.size;
}
export function commitmentComplete(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment, date: string) {
  if (commitment.type === "weekly-quantity") {
    const start = weekStart(date), end = weekEnd(date);
    return activityCountInWindow(data, reset, commitment, start < reset.startDate ? reset.startDate : start, end > reset.endDate ? reset.endDate : end) >= (commitment.targetPerWeek ?? 1);
  }
  if (commitment.type === "weekly-recurring") {
    const start = weekStart(date), end = weekEnd(date);
    return activityCountInWindow(data, reset, commitment, start < reset.startDate ? reset.startDate : start, end > reset.endDate ? reset.endDate : end) >= 1;
  }
  return activityCountInWindow(data, reset, commitment, date) > 0;
}
