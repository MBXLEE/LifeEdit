import type { LifeData } from "./life-store";

export function removeGoalAndReferences(data: LifeData, goalId: string): LifeData {
  return {
    ...data,
    goals: data.goals.filter(goal => goal.id !== goalId).map(goal => goal.parent === goalId ? { ...goal, parent: "" } : goal),
    board: data.board.filter(item => item.goalId !== goalId),
  };
}

export function pillarIsReferenced(data: LifeData, pillar: string): boolean {
  return data.goals.some(goal => goal.pillars.includes(pillar))
    || data.journals.some(entry => entry.pillar === pillar)
    || data.templates.some(template => template.pillar === pillar)
    || data.tasks.some(task => task.pillar === pillar)
    || data.board.some(item => item.category === pillar)
    || data.lifeResets.some(reset => reset.pillars.includes(pillar) || reset.commitments.some(commitment => commitment.pillar === pillar))
    || data.improvementPlans.some(plan => plan.pillar === pillar);
}
