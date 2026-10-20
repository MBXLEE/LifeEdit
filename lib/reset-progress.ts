import type { LifeData, LifeResetProgram, ResetStatus, ResetCommitment, ResetActivity } from "./life-store";
import { completedTaskDates } from "./planner";
const dayMs = 86_400_000;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const supportedResetLinkedFeatures = ["Fitness", "Habits", "Journal", "Planner", "Spiritual", "Focus"] as const;
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
  if (commitment.type === "daily") return commitment.targetPerDay && commitment.targetPerDay > 1 ? `${commitment.targetPerDay}x every day` : "Every day";
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
  const words = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(word => word.length > 2);
  const sourceWords = words(commitment.sourceHint || commitment.title);
  const matches = (value: string) => {
    const valueWords = new Set(words(value));
    return sourceWords.length > 0 && sourceWords.every(word => valueWords.has(word));
  };
  if (commitment.linkedFeature === "Fitness") {
    const inWindow = data.workoutLogs.filter(log => inRange(log.date));
    const genericFitness = sourceWords.some(word => ["workout", "exercise", "move", "movement", "fitness"].includes(word));
    const matched = commitment.sourceHint && !genericFitness ? inWindow.filter(log => matches(log.name)) : inWindow;
    return matched.map(log => ({ id: `fitness-${log.id}`, commitmentId: commitment.id, date: log.date, source: "fitness", externalId: log.id, note: log.name }));
  }
  if (commitment.linkedFeature === "Habits") {
    return data.habits.filter(habit => habit.direction === "build" && matches(habit.name)).flatMap(habit => habit.dates.filter(inRange).map(date => ({ id: `habit-${habit.id}-${date}`, commitmentId: commitment.id, date, source: "habit" as const, externalId: habit.id, note: habit.name })));
  }
  if (commitment.linkedFeature === "Journal") {
    return data.journals.filter(journal => inRange(journal.date) && journal.pillar === commitment.pillar && (!commitment.sourceHint || matches(`${journal.title} ${journal.body}`))).map(journal => ({ id: `journal-${journal.id}`, commitmentId: commitment.id, date: journal.date, source: "journal", externalId: journal.id, note: journal.title }));
  }
  if (commitment.linkedFeature === "Spiritual") {
    const prayerOnly = sourceWords.some(word => ["pray", "prayer", "quiet"].includes(word));
    const studyOnly = sourceWords.some(word => ["read", "reading", "passage", "study", "scripture"].includes(word));
    return [
      ...data.prayers.filter(row => inRange(row.date) && (!studyOnly || prayerOnly)).map(row => ({ id: `prayer-${row.id}`, commitmentId: commitment.id, date: row.date, source: "spiritual" as const, externalId: row.id, note: row.title })),
      ...data.studyPlans.filter(row => inRange(row.date) && (!prayerOnly || studyOnly)).map(row => ({ id: `study-${row.id}`, commitmentId: commitment.id, date: row.date, source: "spiritual" as const, externalId: row.id, note: row.title }))
    ];
  }
  if (commitment.linkedFeature === "Planner") {
    return data.tasks.filter(task => matches(task.title)).flatMap(task => completedTaskDates(task, start, end).map(date => ({ id: `planner-${task.id}-${date}`, commitmentId: commitment.id, date, source: "planner" as const, externalId: `${task.id}:${date}`, note: task.title })));
  }
  if (commitment.linkedFeature === "Focus") {
    return data.focus.filter(row => inRange(row.date) && (!commitment.sourceHint || matches(row.name))).map(row => ({ id: `focus-${row.id}`, commitmentId: commitment.id, date: row.date, source: "focus", externalId: row.id, note: row.name, value: row.seconds }));
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
  const activities = allActivities(data, reset, commitment).filter(activity => activity.date >= start && activity.date <= end);
  const syncedDates = new Set(activities.filter(activity => activity.source !== "reset").map(activity => activity.date));
  return activities.filter(activity => activity.source !== "reset" || !syncedDates.has(activity.date)).length;
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
  return activityCountInWindow(data, reset, commitment, date) >= (commitment.targetPerDay ?? 1);
}
