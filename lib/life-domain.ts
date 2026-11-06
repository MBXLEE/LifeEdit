export type Exercise = { id: string; name: string; category: string; sets: number; reps: number; weight: number; rest: number; seconds: number; notes: string; equipment?: string; difficulty?: "Beginner" | "Intermediate" | "Advanced"; secondaryMuscles?: string; instructions?: string; description?: string; image?: string; videoUrl?: string };
export type FocusPlan = { id: string; name: string; focusMinutes: number; breakMinutes: number; sessions: number; completed: number; phase: "focus" | "break" | "finished"; running: boolean; endsAt: number | null; remaining: number; lastTransitionAt?: number; lastPhase?: "focus" | "break" };
export type RelationshipMoment = { id: string; kind: "journal" | "memory" | "interaction" | "reflection"; date: string; title: string; body: string; photos: { id: string; source: string; name?: string }[] };
export type RelationshipPlan = { id: string; title: string; date: string; note: string; completed: boolean; plannerTaskId?: string };
export type Relationship = { id: string; name: string; birthday: string; followUp: string; goal: string; notes: string; archived: boolean; type?: string; importance?: string; lastContact?: string; conversations?: string; dateIdeas?: string; giftIdeas?: string; memories?: string; nickname?: string; avatar?: string; cover?: string; favourite?: boolean; anniversary?: string; appreciation?: string; preferences?: string; reminderEnabled?: boolean; moments?: RelationshipMoment[]; plans?: RelationshipPlan[]; customFields?: { id: string; label: string; value: string }[] };
export function hydrateRelationship(person: Relationship): Relationship {
  const legacyMemory: RelationshipMoment[] = person.memories?.trim() ? [{ id: `legacy-memory-${person.id}`, kind: "memory", date: person.lastContact ?? "", title: "An earlier memory", body: person.memories, photos: [] }] : [];
  return { ...person, moments: person.moments ?? legacyMemory, plans: person.plans ?? [], customFields: person.customFields ?? [], reminderEnabled: person.reminderEnabled ?? Boolean(person.followUp) };
}
export function syncRelationshipPlans(relationships: Relationship[], tasks: { id: string; date: string; done: boolean }[]): Relationship[] {
  const taskById = new Map(tasks.map(task => [task.id, task]));
  let anyChanged = false;
  const synced = relationships.map(person => {
    if (!person.plans?.length) return person;
    let personChanged = false;
    const plans = person.plans.map(plan => {
      const task = plan.plannerTaskId ? taskById.get(plan.plannerTaskId) : undefined;
      if (!task || (plan.date === task.date && plan.completed === task.done)) return plan;
      personChanged = true;
      return { ...plan, date: task.date, completed: task.done };
    });
    if (!personChanged) return person;
    anyChanged = true;
    return { ...person, plans };
  });
  return anyChanged ? synced : relationships;
}
export type ExtraData = {
  savingsGoals: { id: string; title: string; target: number; saved: number; currency: string; due: string; archived: boolean }[];
  allocation: { enabled: boolean; needs: number; wants: number; savings: number };
  exerciseCategories: string[];
  exercises: Exercise[];
  measurements: { id: string; date: string; weight: number; waist: number; chest: number; hips: number; notes: string; arms?: number; thighs?: number; calves?: number; custom?: Record<string, number> }[];
  relationships: Relationship[];
  prayers: { id: string; title: string; notes: string; date: string; answered: boolean; archived: boolean }[];
  studyPlans: { id: string; title: string; passage: string; notes: string; progress: number; date: string; archived: boolean }[];
  focusPlan: FocusPlan | null;
};
export const recommendedExercises: Record<string, string[]> = {
  "Upper Body": ["Bench Press", "Incline Dumbbell Press", "Shoulder Press", "Lat Pulldown", "Seated Row", "Bicep Curls", "Tricep Pushdown"],
  "Lower Body": ["Squats", "Romanian Deadlifts", "Leg Press", "Lunges", "Calf Raises", "Hip Thrusts"],
  "Core": ["Plank", "Dead Bug", "Bird Dog"],
  "Cardio": ["Walking", "Cycling", "Light Jogging"],
  "Mobility": ["Hip Mobility", "Shoulder Mobility", "Gentle Stretching"]
};
export const workoutTemplates: Record<string, string[]> = {
  "Full Body": ["Squats", "Bench Press", "Seated Row", "Plank"],
  "Upper Body": recommendedExercises["Upper Body"], "Lower Body": recommendedExercises["Lower Body"],
  "Push Day": ["Bench Press", "Shoulder Press", "Tricep Pushdown"], "Pull Day": ["Lat Pulldown", "Seated Row", "Bicep Curls"],
  "Leg Day": ["Squats", "Romanian Deadlifts", "Lunges", "Calf Raises"], "Cardio": ["Walking", "Cycling"], "Core": recommendedExercises.Core,
  "Mobility": recommendedExercises.Mobility, "Recovery": ["Walking", "Gentle Stretching"]
};
export function extraDefaults(): ExtraData {
  return { savingsGoals: [], allocation: { enabled: false, needs: 50, wants: 30, savings: 20 }, exerciseCategories: Object.keys(recommendedExercises),
    exercises: Object.entries(recommendedExercises).flatMap(([category, names]) => names.map((name, i) => ({ id: `library-${category}-${i}`, name, category, sets: ["Cardio", "Mobility", "Core"].includes(category) ? 1 : 3, reps: ["Cardio", "Mobility", "Core"].includes(category) ? 0 : 10, weight: 0, rest: 60, seconds: ["Cardio", "Mobility", "Core"].includes(category) ? 60 : 0, notes: "" }))),
    measurements: [], relationships: [], prayers: [], studyPlans: [], focusPlan: null };
}
export function localDate(time: number) { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
// Absolute deadlines allow suspended tabs and refreshed pages to catch up once.
export function advanceFocus(plan: FocusPlan, now: number) {
  let next = { ...plan };
  const logs: { id: string; name: string; seconds: number; date: string }[] = [];
  while (next.running && next.endsAt !== null && now >= next.endsAt) {
    const boundary = next.endsAt;
    next.lastTransitionAt = boundary; next.lastPhase = next.phase as "focus" | "break";
    if (next.phase === "focus") {
      next.completed++;
      logs.push({ id: `${next.id}-${next.completed}`, name: next.name, seconds: next.focusMinutes * 60, date: localDate(boundary) });
      if (next.completed >= next.sessions) { next = { ...next, phase: "finished", running: false, endsAt: null, remaining: 0 }; break; }
      next.phase = next.breakMinutes > 0 ? "break" : "focus";
    } else next.phase = "focus";
    next.remaining = (next.phase === "focus" ? next.focusMinutes : next.breakMinutes) * 60;
    next.endsAt = boundary + next.remaining * 1000;
  }
  return { plan: next, logs };
}
export function plannedSecondsLeft(plan: FocusPlan, now: number) {
  if (plan.phase === "finished") return 0;
  const current = plan.running && plan.endsAt ? Math.max(0, (plan.endsAt - now) / 1000) : plan.remaining;
  const futureFocus = plan.sessions - plan.completed - (plan.phase === "focus" ? 1 : 0);
  const futureBreaks = Math.max(0, plan.sessions - plan.completed - 1);
  return current + futureFocus * plan.focusMinutes * 60 + futureBreaks * plan.breakMinutes * 60;
}
