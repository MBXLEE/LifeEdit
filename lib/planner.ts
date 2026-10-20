import type { Task } from "./life-store";

const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
const parseDate = (value: string) => new Date(`${value}T12:00:00Z`);
const dateValue = (value: string) => isoPattern.test(value) ? parseDate(value).getTime() : Number.NaN;

export function addTaskDays(value: string, amount: number) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function taskOccursOn(task: Task, day: string) {
  const dayValue = dateValue(day), startValue = dateValue(task.date);
  if (!Number.isFinite(dayValue) || !Number.isFinite(startValue) || task.excludedDates?.includes(day)) return false;
  const recurrence = task.recurrence ?? "none";
  if (recurrence === "none") return task.date === day;
  if (day < task.date || (task.recurrenceEnd && day > task.recurrenceEnd)) return false;
  const date = parseDate(day), start = parseDate(task.date);
  if (recurrence === "daily") return true;
  if (recurrence === "weekdays") return date.getUTCDay() >= 1 && date.getUTCDay() <= 5;
  if (recurrence === "weekly") return date.getUTCDay() === start.getUTCDay();
  if (recurrence === "monthly") {
    const finalDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    return date.getUTCDate() === Math.min(start.getUTCDate(), finalDay);
  }
  return false;
}

export function taskDoneOn(task: Task, day: string) {
  return task.recurrence && task.recurrence !== "none" ? Boolean(task.completedDates?.includes(day)) : task.done;
}

export function setTaskDoneOn(task: Task, day: string, done = !taskDoneOn(task, day)): Task {
  if (!task.recurrence || task.recurrence === "none") return { ...task, done };
  const completed = new Set(task.completedDates ?? []);
  if (done) completed.add(day); else completed.delete(day);
  return { ...task, completedDates: [...completed].sort() };
}

export function excludeTaskOccurrence(task: Task, day: string): Task {
  if (!task.recurrence || task.recurrence === "none") return task;
  const excluded = new Set(task.excludedDates ?? []), completed = new Set(task.completedDates ?? []);
  excluded.add(day); completed.delete(day);
  return { ...task, excludedDates: [...excluded].sort(), completedDates: [...completed].sort() };
}

export function completedTaskDates(task: Task, start: string, end: string) {
  if (!task.recurrence || task.recurrence === "none") return task.done && task.date >= start && task.date <= end ? [task.date] : [];
  return [...new Set(task.completedDates ?? [])].filter(day => day >= start && day <= end && taskOccursOn(task, day)).sort();
}

export function taskOccurrenceCount(tasks: Task[], start: string, end: string, predicate: (task: Task) => boolean = () => true) {
  return tasks.filter(predicate).reduce((count, task) => count + completedTaskDates(task, start, end).length, 0);
}

export function completedTaskDays(tasks: Task[], start: string, end: string) {
  return [...new Set(tasks.flatMap(task => completedTaskDates(task, start, end)))].sort();
}
