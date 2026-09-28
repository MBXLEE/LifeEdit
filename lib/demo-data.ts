import type { LifeData } from "./life-store";
import { localDate } from "./life-domain";
import { paydayCycleForDate } from "./refinements";

const octoberDemoDate = new Date("2026-10-10T12:00:00");

export function createDemoData(base: LifeData, now = octoberDemoDate): LifeData {
  const date = (offset = 0) => { const d = new Date(now); d.setDate(d.getDate() + offset); return localDate(d.getTime()); };
  const cycle = paydayCycleForDate(date(), base.financeSettings?.payday ?? 25);
  const month = cycle.budgetMonth;
  const monthly = (start: string) => ({ recurring: true as const, recurrenceFrequency: "Monthly" as const, recurrenceInterval: 1, recurrenceStart: start });
  const assessment = Object.fromEntries(base.areas.map((area, i) => [area, [7, 8, 6, 7, 8, 7][i] ?? 7]));
  const exercise = { ...base.exercises[0], id: "demo-exercise", name: "Bench Press", sets: 3, reps: 10, weight: 20, rest: 60, seconds: 0, notes: "Adjust the plan to your own routine." };
  return {
    ...base, name: "Demo User", theme: "Ocean", onboarded: true, assessment,
    financeSettings: { payday: 25, payFrequency: "Monthly" },
    allocation: { enabled: true, needs: 50, wants: 30, savings: 20 },
    categories: ["Rent", "Car", "Utilities", "Groceries", "Family", "Credit Card", "Loan", "Store Cards", "Wifi", "Gym", "Petrol", "Car Insurance", "Phone Insurance", "Policies", "Beauty Maintenance", "Fun", "Savings"],
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
      { id: "demo-goal-3", title: "Create a peaceful evening routine", horizon: "Quarterly", parent: "", pillars: ["Mental & Emotional", "Spiritual"], progress: 25, archived: false, due: date(90), notes: "Less rushing, more reflection." },
    ],
    transactions: [
      { id: "demo-income", title: "Salary", type: "Income", category: "Income", amount: 22000, currency: "ZAR", date: cycle.start, ...monthly(cycle.start) },
      { id: "demo-rent", title: "Rent", type: "Expense", classification: "Need", category: "Rent", amount: 5500, currency: "ZAR", date: cycle.start, dueDate: cycle.start, paid: true, paidDate: cycle.start, status: "Paid", ...monthly(cycle.start) },
      { id: "demo-car-payment", title: "Car Payment", type: "Expense", classification: "Need", category: "Car", amount: 4500, currency: "ZAR", date: date(-12), dueDate: date(-12), paid: true, paidDate: date(-12), status: "Paid", ...monthly(date(-12)) },
      { id: "demo-utilities", title: "Utilities, electricity, water and levy", type: "Expense", classification: "Need", category: "Utilities", amount: 1500, currency: "ZAR", date: date(-9), dueDate: date(-9), paid: true, paidDate: date(-9), status: "Paid", ...monthly(date(-9)) },
      { id: "demo-groceries", title: "Groceries", type: "Expense", classification: "Need", category: "Groceries", amount: 2000, currency: "ZAR", date: date(-5), dueDate: date(-5), paid: true, paidDate: date(-5), status: "Paid", ...monthly(date(-5)) },
      { id: "demo-family", title: "Family Support", type: "Expense", classification: "Need", category: "Family", amount: 1500, currency: "ZAR", date: date(-3), dueDate: date(-3), paid: true, paidDate: date(-3), status: "Paid", ...monthly(date(-3)) },
      { id: "demo-credit-card", title: "Credit Card", type: "Expense", classification: "Need", category: "Credit Card", amount: 1000, currency: "ZAR", date: date(1), dueDate: date(1), paid: false, status: "Upcoming", ...monthly(date(1)) },
      { id: "demo-loan", title: "Loan", type: "Expense", classification: "Need", category: "Loan", amount: 1000, currency: "ZAR", date: date(2), dueDate: date(2), paid: false, status: "Upcoming", ...monthly(date(2)) },
      { id: "demo-store-cards", title: "Store Cards", type: "Expense", classification: "Need", category: "Store Cards", amount: 500, currency: "ZAR", date: date(3), dueDate: date(3), paid: false, status: "Upcoming", ...monthly(date(3)) },
      { id: "demo-wifi", title: "Wifi", type: "Expense", classification: "Need", category: "Wifi", amount: 300, currency: "ZAR", date: date(-1), dueDate: date(-1), paid: false, status: "Missed", ...monthly(date(-1)) },
      { id: "demo-gym", title: "Gym", type: "Expense", classification: "Want", category: "Gym", amount: 800, currency: "ZAR", date: date(5), dueDate: date(5), paid: false, status: "Upcoming", ...monthly(date(5)) },
      { id: "demo-petrol", title: "Petrol", type: "Expense", classification: "Need", category: "Petrol", amount: 1500, currency: "ZAR", date: date(6), dueDate: date(6), paid: false, status: "Upcoming", ...monthly(date(6)) },
      { id: "demo-car-insurance", title: "Car Insurance", type: "Expense", classification: "Need", category: "Car Insurance", amount: 650, currency: "ZAR", date: date(7), dueDate: date(7), paid: false, status: "Upcoming", ...monthly(date(7)) },
      { id: "demo-phone-insurance", title: "Phone Insurance", type: "Expense", classification: "Need", category: "Phone Insurance", amount: 200, currency: "ZAR", date: date(8), dueDate: date(8), paid: false, status: "Upcoming", ...monthly(date(8)) },
      { id: "demo-policies", title: "Policies", type: "Expense", classification: "Need", category: "Policies", amount: 200, currency: "ZAR", date: date(9), dueDate: date(9), paid: false, status: "Upcoming", ...monthly(date(9)) },
      { id: "demo-beauty", title: "Monthly Beauty Maintenance", type: "Expense", classification: "Want", category: "Beauty Maintenance", amount: 2000, currency: "ZAR", date: date(10), plannedDate: date(10), paid: false, status: "Upcoming", ...monthly(date(10)) },
      { id: "demo-fun", title: "Fun Envelope", type: "Expense", classification: "Want", category: "Fun", amount: 2000, currency: "ZAR", date: date(11), plannedDate: date(11), paid: false, status: "Upcoming", ...monthly(date(11)) },
    ],
    budgets: [
      { id: "demo-budget-rent", category: "Rent", amount: 5500, currency: "ZAR", month },
      { id: "demo-budget-car", category: "Car", amount: 4500, currency: "ZAR", month },
      { id: "demo-budget-utilities", category: "Utilities", amount: 1500, currency: "ZAR", month },
      { id: "demo-budget-groceries", category: "Groceries", amount: 2000, currency: "ZAR", month },
      { id: "demo-budget-family", category: "Family", amount: 1500, currency: "ZAR", month },
      { id: "demo-budget-credit-card", category: "Credit Card", amount: 1000, currency: "ZAR", month },
      { id: "demo-budget-loan", category: "Loan", amount: 1000, currency: "ZAR", month },
      { id: "demo-budget-store-cards", category: "Store Cards", amount: 500, currency: "ZAR", month },
      { id: "demo-budget-wifi", category: "Wifi", amount: 300, currency: "ZAR", month },
      { id: "demo-budget-gym", category: "Gym", amount: 800, currency: "ZAR", month },
      { id: "demo-budget-petrol", category: "Petrol", amount: 1500, currency: "ZAR", month },
      { id: "demo-budget-car-insurance", category: "Car Insurance", amount: 650, currency: "ZAR", month },
      { id: "demo-budget-phone-insurance", category: "Phone Insurance", amount: 200, currency: "ZAR", month },
      { id: "demo-budget-policies", category: "Policies", amount: 200, currency: "ZAR", month },
      { id: "demo-budget-beauty", category: "Beauty Maintenance", amount: 2000, currency: "ZAR", month },
      { id: "demo-budget-fun", category: "Fun", amount: 2000, currency: "ZAR", month },
      { id: "demo-budget-savings", category: "Savings", amount: 0, currency: "ZAR", month },
    ],
    dailyBudgetPlans: [],
    weeklyBudgetPlans: [
      { id: "demo-week-1", month, weekStart: cycle.start, weekEnd: date(-9), amount: 11500, currency: "ZAR" },
      { id: "demo-week-2", month, weekStart: date(-8), weekEnd: date(-2), amount: 5000, currency: "ZAR" },
      { id: "demo-week-3", month, weekStart: date(-1), weekEnd: date(5), amount: 3650, currency: "ZAR" },
      { id: "demo-week-4", month, weekStart: date(6), weekEnd: cycle.end, amount: 5000, currency: "ZAR" },
    ],
    savingsGoals: [{ id: "demo-savings-goal", title: "Emergency fund", target: 50000, saved: 20000, currency: "ZAR", due: date(180), archived: false }],
    board: [
      { id: "demo-board-1", title: "Calm home workspace", url: "", category: "Career", notes: "A place that supports deep work.", goalId: "demo-goal-3", kind: "image", target: 12000, saved: 3500, currency: "ZAR", quote: "Make the room easy to begin in.", coachNote: "Choose one small improvement this month." },
      { id: "demo-board-2", title: "Emergency fund milestone", url: "", category: "Finance", notes: "Savings is R0 with the current budget because commitments are R3,150 above salary.", goalId: "demo-goal-1", kind: "money", target: 50000, saved: 20000, currency: "ZAR", quote: "Security creates options.", coachNote: "Free up at least R3,150 before setting a savings transfer." },
      { id: "demo-board-3", title: "Saturday trail walk", url: "", category: "Fitness", notes: "Movement that feels restorative.", goalId: "demo-goal-2", kind: "image", quote: "Strong, steady, outside.", coachNote: "Book it like an appointment." },
    ],
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
