import type { LifeData } from "./life-store";
import { localDate } from "./life-domain";

export function createDemoData(base: LifeData, now = new Date()): LifeData {
  const date = (offset = 0) => { const d = new Date(now); d.setDate(d.getDate() + offset); return localDate(d.getTime()); };
  const month = date().slice(0, 7);
  const assessment = Object.fromEntries(base.areas.map((area, i) => [area, [7, 8, 6, 7, 8, 7][i] ?? 7]));
  const exercise = { ...base.exercises[0], id: "demo-exercise", name: "Bench Press", sets: 3, reps: 10, weight: 20, rest: 60, seconds: 0, notes: "Adjust the plan to your own routine." };
  return {
    ...base, name: "Demo User", theme: "Ocean", onboarded: true, assessment,
    priorities: ["Physical", "Financial", "Personal Growth"],
    identity: "A focused, healthy person who makes time for what matters.",
    vision: "Build a balanced life with meaningful work, strong relationships, and room to grow.",
    mission: "Make one intentional improvement every day.", lifestyle: "Consistent routines, regular movement, and unhurried evenings.",
    reviews: [{ id: "demo-review", date: date(), ratings: assessment, notes: "Starting demo life assessment." }],
    reviewSchedule: { ...base.reviewSchedule, start: date() },
    tasks: [
      { id: "demo-task-1", title: "Morning workout", date: date(), time: "07:00", minutes: 45, pillar: "Physical", done: true },
      { id: "demo-task-2", title: "Plan the week", date: date(), time: "09:00", minutes: 30, pillar: "Personal Growth", done: false },
      { id: "demo-task-3", title: "Evening reflection", date: date(), time: "20:00", minutes: 15, pillar: "Mental & Emotional", done: false },
    ],
    habits: [
      { id: "demo-habit-1", name: "Read for 20 minutes", direction: "build", dates: [date(-2), date(-1), date()], start: date(-7), setbacks: [] },
      { id: "demo-habit-2", name: "Daily walk", direction: "build", dates: [date(-3), date(-1)], start: date(-7), setbacks: [] },
      { id: "demo-habit-3", name: "Reduce late-night scrolling", direction: "quit", dates: [], start: date(-12), setbacks: [] },
    ],
    journals: [
      { id: "demo-journal-1", title: "A small win", template: "pillar-2", pillar: "Mental & Emotional", body: "I made space for a walk and returned to work feeling clearer. Tomorrow I will protect that time again.", date: date(-1) },
      { id: "demo-journal-2", title: "This week's intention", template: "pillar-5", pillar: "Personal Growth", body: "Focus on one meaningful task before opening social media.", date: date() },
    ],
    goals: [
      { id: "demo-goal-1", title: "Build an emergency fund", horizon: "Annual", parent: "", pillars: ["Financial"], progress: 40, archived: false, due: date(180), notes: "A little each month adds up." },
      { id: "demo-goal-2", title: "Move three times a week", horizon: "Monthly", parent: "", pillars: ["Physical"], progress: 50, archived: false, due: date(30), notes: "Choose activities I enjoy." },
    ],
    transactions: [
      { id: "demo-income", title: "Demo salary", type: "Income", category: "Income", amount: 28000, currency: "ZAR", date: `${month}-01` },
      { id: "demo-rent", title: "Rent", type: "Expense", classification: "Need", category: "Housing", amount: 8500, currency: "ZAR", date: `${month}-01` },
      { id: "demo-food", title: "Weekly groceries", type: "Expense", classification: "Need", category: "Food", amount: 650, currency: "ZAR", date: date() },
      { id: "demo-saving", title: "Emergency fund contribution", type: "Savings", classification: "Savings", category: "Savings", amount: 2000, currency: "ZAR", date: date() },
    ],
    budgets: [
      { id: "demo-budget-1", category: "Housing", amount: 8500, currency: "ZAR", month },
      { id: "demo-budget-2", category: "Food", amount: 3000, currency: "ZAR", month },
    ],
    savingsGoals: [{ id: "demo-savings-goal", title: "Emergency fund", target: 50000, saved: 20000, currency: "ZAR", due: date(180), archived: false }],
    workouts: [{ id: "demo-workout", name: "Upper body session", category: "Upper Body", warmup: "Gentle mobility", cooldown: "Easy stretching", notes: "Sample workout plan", archived: false, exercises: [exercise] }],
    workoutLogs: [{ id: "demo-workout-log", name: "Upper body session", date: date(-2), minutes: 40, volume: 600, exercises: [exercise], notes: "Completed sample session." }],
    measurements: [{ id: "demo-measurement", date: date(-2), weight: 70, waist: 80, chest: 95, hips: 98, notes: "Sample measurement, not a target." }],
    relationships: [
      { id: "demo-person-1", name: "Alex", type: "Friends", importance: "Close circle", birthday: "1995-06-12", lastContact: date(-7), followUp: date(), goal: "Catch up over coffee", notes: "Ask about the new project.", archived: false },
      { id: "demo-person-2", name: "Sam", type: "Family", importance: "Important", birthday: "1990-11-05", lastContact: date(-2), followUp: date(5), goal: "Plan a weekend visit", notes: "Enjoys cooking together.", archived: false },
    ],
    focus: [{ id: "demo-focus-1", name: "Deep Work", seconds: 1500, date: date() }],
    prayers: [{ id: "demo-prayer", title: "Gratitude and direction", notes: "Make room for quiet reflection.", date: date(), answered: false, archived: false }],
    studyPlans: [{ id: "demo-study", title: "Daily reflection", passage: "Psalm 23", notes: "Reflect on one passage each day.", progress: 20, date: date(), archived: false }],
  };
}
