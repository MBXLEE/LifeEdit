export type FitnessSettings = {
  weightUnit: "kg" | "lb";
  lengthUnit: "cm" | "in";
  restSeconds: number;
  workoutDays: number[];
  reminders: boolean;
  defaultTab: "Progress" | "Workouts" | "Exercise Library" | "Plans" | "Nutrition" | "Settings";
  showWeight: boolean;
};
export type FitnessGoal = { id: string; title: string; kind: "strength" | "cardio" | "consistency" | "muscle" | "weight" | "mobility" | "programme" | "custom"; target: number | null; current?: number; exerciseName?: string; due?: string; archived?: boolean; createdAt: string };
export type FitnessPlanDay = { weekday: number; workoutId: string | null; rest: boolean };
export type FitnessPlan = { id: string; name: string; objective: string; weeks: number; startDate: string; status: "active" | "paused" | "archived"; days: FitnessPlanDay[]; createdAt: string };
export type ScheduledWorkout = { id: string; date: string; workoutId: string | null; name: string; category: string; minutes: number; rest: boolean; completed: boolean; planId?: string; logId?: string; notes?: string };
export type LoggedSet = { id: string; exerciseId: string; exerciseName: string; order: number; reps: number; weightKg: number; seconds: number; completedAt?: string };
export type ActiveWorkoutSession = { id: string; workoutId?: string; scheduleId?: string; scheduleDate?: string; planId?: string; name: string; category: string; startedAt: number; pausedAt?: number; pausedMs: number; currentIndex: number; sets: LoggedSet[]; notes: string; restUntil?: number };
export type NutritionEntry = { id: string; date: string; kind: "meal" | "water"; title: string; amount: number; unit: "ml" | "kcal"; protein?: number; carbs?: number; fat?: number; notes?: string };
export const defaultFitnessSettings = (): FitnessSettings => ({ weightUnit: "kg", lengthUnit: "cm", restSeconds: 60, workoutDays: [], reminders: false, defaultTab: "Progress", showWeight: true });
export const kgToDisplay = (kg: number, unit: "kg" | "lb") => unit === "lb" ? kg * 2.2046226218 : kg;
export const displayToKg = (value: number, unit: "kg" | "lb") => unit === "lb" ? value / 2.2046226218 : value;
export const cmToDisplay = (cm: number, unit: "cm" | "in") => unit === "in" ? cm / 2.54 : cm;
export const displayToCm = (value: number, unit: "cm" | "in") => unit === "in" ? value * 2.54 : value;
export function mondayOf(dateString: string): string { const date = new Date(`${dateString}T12:00:00`); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function addDays(dateString: string, days: number): string { const date = new Date(`${dateString}T12:00:00`); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function weekDates(anchor: string): string[] { const monday = mondayOf(anchor); return Array.from({ length: 7 }, (_, index) => addDays(monday, index)); }
export function planOccurrence(plan: FitnessPlan, date: string): FitnessPlanDay | null { if (plan.status !== "active" || date < plan.startDate || date >= addDays(plan.startDate, plan.weeks * 7)) return null; return plan.days.find(day => day.weekday === new Date(`${date}T12:00:00`).getDay()) ?? null; }
export function elapsedSessionSeconds(session: ActiveWorkoutSession, now: number): number { return Math.max(0, Math.floor(((session.pausedAt ?? now) - session.startedAt - session.pausedMs) / 1000)); }
export function completedVolume(sets: LoggedSet[]): number { return sets.filter(set => set.completedAt && set.weightKg > 0 && set.reps > 0).reduce((sum, set) => sum + set.weightKg * set.reps, 0); }
export function goalProgress(goal: FitnessGoal, logs: { date: string; exercises?: { name: string; weight: number }[]; sets?: LoggedSet[] }[], currentWeightKg?: number): number | null {
  if (!goal.target || goal.target <= 0) return null;
  if (goal.kind === "consistency") { const now = new Date(); const monday = mondayOf(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`); const count = logs.filter(log => log.date >= monday && log.date <= addDays(monday, 6)).length; return Math.min(100, count / goal.target * 100); }
  if (goal.kind === "weight" && currentWeightKg !== undefined && goal.current && goal.current !== goal.target) return Math.max(0, Math.min(100, (currentWeightKg - goal.current) / (goal.target - goal.current) * 100));
  if (goal.kind === "strength" && goal.exerciseName) { const best = Math.max(0, ...logs.flatMap(log => [ ...(log.sets || []).filter(set => set.completedAt && set.exerciseName === goal.exerciseName).map(set => set.weightKg), ...(log.exercises || []).filter(ex => ex.name === goal.exerciseName).map(ex => ex.weight) ])); return Math.min(100, best / goal.target * 100); }
  if (goal.current !== undefined) return Math.min(100, Math.max(0, goal.current / goal.target * 100));
  return null;
}
