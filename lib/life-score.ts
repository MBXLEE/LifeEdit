export type DailyAlignment = {
  tasksCompleted: number;
  totalTasks: number;
  habitsCompleted: number;
  totalHabits: number;
  focusSessionsCompleted: number;
  focusTarget: number;
  workoutCompleted: boolean;
  journalCompleted: boolean;
  spiritualActivities: number;
  spiritualTarget: number;
  goalProgressPercent: number;
};

const ratio = (value: number, total: number) => {
  if (total <= 0) return 1;
  return Math.min(value / total, 1);
};

export function calculateLifeScore(alignment: DailyAlignment) {
  const weighted =
    ratio(alignment.tasksCompleted, alignment.totalTasks) * 22 +
    ratio(alignment.habitsCompleted, alignment.totalHabits) * 20 +
    ratio(alignment.focusSessionsCompleted, alignment.focusTarget) * 14 +
    (alignment.workoutCompleted ? 12 : 0) +
    (alignment.journalCompleted ? 10 : 0) +
    ratio(alignment.spiritualActivities, alignment.spiritualTarget) * 10 +
    Math.min(alignment.goalProgressPercent, 100) * 0.12;

  return Math.round(Math.min(weighted, 100));
}
