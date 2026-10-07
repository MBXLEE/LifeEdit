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
    lifePillars: [...base.lifePillars, "Career"],
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
      { id: "demo-reset-journal-1", title: "Project 50 weekly review", template: "pillar-5", pillar: "Personal Growth", body: "This week felt steadier. The gym target is working because I can choose the days without failing early.", date: date(-3) },
      { id: "demo-reset-journal-2", title: "Bible Reset reflection", template: "pillar-4", pillar: "Spiritual", body: "Reading before work made the whole morning feel calmer.", date: date(-1) },
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
    workoutLogs: [
      { id: "demo-workout-log", name: "Upper body session", date: date(-2), minutes: 40, volume: 600, exercises: [exercise], notes: "Completed sample session." },
      { id: "demo-reset-workout-1", name: "Project 50 gym session", date: date(-5), minutes: 48, volume: 700, exercises: [exercise], notes: "Synced into Life Reset." },
      { id: "demo-reset-workout-2", name: "Project 50 gym session", date: date(-3), minutes: 42, volume: 560, exercises: [exercise], notes: "Synced into Life Reset." },
      { id: "demo-reset-workout-3", name: "Project 50 gym session", date: date(-1), minutes: 45, volume: 610, exercises: [exercise], notes: "Synced into Life Reset." },
    ],
    measurements: [{ id: "demo-measurement", date: date(-2), weight: 70, waist: 80, chest: 95, hips: 98, notes: "Sample measurement, not a target." }],
    relationships: [
      { id: "demo-person-1", name: "Alex", type: "Friends", importance: "Close circle", birthday: "1995-06-12", lastContact: date(-7), followUp: date(), goal: "Catch up over coffee", notes: "Ask about the new project.", archived: false },
      { id: "demo-person-2", name: "Sam", type: "Family", importance: "Important", birthday: "1990-11-05", lastContact: date(-2), followUp: date(5), goal: "Plan a weekend visit", notes: "Enjoys cooking together.", archived: false },
    ],
    focus: [{ id: "demo-focus-1", name: "Deep Work", seconds: 1500, date: date() }],
    prayers: [{ id: "demo-prayer", title: "Gratitude and direction", notes: "Make room for quiet reflection.", date: date(), answered: false, archived: false }],
    studyPlans: [{ id: "demo-study", title: "Daily reflection", passage: "Psalm 23", notes: "Reflect on one passage each day.", progress: 20, date: date(), archived: false }],
    lifeResets: [
      {
        id: "demo-reset-project-50", templateId: "project-50", name: "Project 50", publicName: "50 days of focus", why: "Rebuild routine, reduce scrolling, and make movement non-negotiable without turning it into a punishment.", outcome: "A calmer morning routine, four training sessions a week, and stronger focus blocks.", startDate: date(-18), endDate: date(31), duration: 50, pillars: ["Physical", "Mental & Emotional", "Personal Growth", "Career"], status: "active", accountability: "Flexible", intensity: "Balanced", restoreAllowance: 2, editAllowance: 2,
        commitments: [
          { id: "p50-morning", title: "Morning routine before scrolling", type: "daily", required: true, pillar: "Mental & Emotional", linkedFeature: "Habits" },
          { id: "p50-gym", title: "Gym or intentional movement", type: "weekly-quantity", targetPerWeek: 4, required: true, pillar: "Physical", linkedFeature: "Fitness", sourceHint: "gym" },
          { id: "p50-learn", title: "Learn for one hour", type: "daily", required: true, pillar: "Career", linkedFeature: "Focus" },
          { id: "p50-sunday", title: "Dedicated Sunday reset", type: "weekly-recurring", scheduleDays: [0], required: true, pillar: "Personal Growth", linkedFeature: "Planner" },
          { id: "p50-social", title: "Social media maximum 60 minutes", type: "limit", limitAmount: 60, limitUnit: "minutes", required: true, pillar: "Mental & Emotional" },
        ],
        activities: [
          ...Array.from({ length: 12 }, (_, i) => ({ id: `p50-morning-${i}`, commitmentId: "p50-morning", date: date(-18 + i), source: "reset" as const })),
          ...Array.from({ length: 13 }, (_, i) => ({ id: `p50-learn-${i}`, commitmentId: "p50-learn", date: date(-18 + i), source: "reset" as const })),
          ...Array.from({ length: 14 }, (_, i) => ({ id: `p50-social-${i}`, commitmentId: "p50-social", date: date(-18 + i), source: "reset" as const })),
          { id: "p50-sunday-1", commitmentId: "p50-sunday", date: date(-14), source: "reset" as const },
          { id: "p50-sunday-2", commitmentId: "p50-sunday", date: date(-7), source: "reset" as const },
        ],
        photos: [
          { id: "p50-photo-start", source: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80", date: date(-18), label: "Starting photo" },
          { id: "p50-photo-mid", source: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80", date: date(-8), label: "Day 10 photo" },
        ],
        changes: [{ id: "p50-change-1", date: date(-1), day: 18, text: "Gym target changed from fixed weekdays to 4x weekly so the window is evaluated fairly." }],
        restores: [{ id: "p50-restore-1", date: date(-10), window: "p50-learn:" + date(-10), note: "Restore used after a travel day." }],
        share: { publicTitle: "50 days of focus", showName: true, showDates: true, showStats: true, showMisses: false, showPhotos: false, showReflection: true, statement: "I kept choosing the person I am becoming." },
        createdAt: date(-19), updatedAt: date(-1)
      },
      {
        id: "demo-reset-bible", templateId: "bible-30", name: "30-Day Bible Reading Reset", publicName: "30 mornings of quiet", why: "Create a simple spiritual rhythm before the day gets loud.", outcome: "Read, reflect, and pray every morning for 30 days.", startDate: date(-6), endDate: date(23), duration: 30, pillars: ["Spiritual", "Mental & Emotional"], status: "active", accountability: "Accountability", intensity: "Gentle", restoreAllowance: 0, editAllowance: 1,
        commitments: [
          { id: "bible-read", title: "Read the daily passage", type: "daily", required: true, pillar: "Spiritual", linkedFeature: "Spiritual" },
          { id: "bible-reflect", title: "Write one reflection", type: "daily", required: true, pillar: "Spiritual", linkedFeature: "Journal" },
          { id: "bible-prayer", title: "Prayer and quiet", type: "daily", required: true, pillar: "Spiritual", linkedFeature: "Spiritual" },
        ],
        activities: [
          ...Array.from({ length: 5 }, (_, i) => ({ id: `bible-read-${i}`, commitmentId: "bible-read", date: date(-6 + i), source: "reset" as const })),
          ...Array.from({ length: 4 }, (_, i) => ({ id: `bible-prayer-${i}`, commitmentId: "bible-prayer", date: date(-6 + i), source: "reset" as const })),
        ],
        photos: [], changes: [], restores: [],
        share: { publicTitle: "30 mornings of quiet", showName: false, showDates: false, showStats: true, showMisses: false, showPhotos: false, showReflection: true, statement: "" },
        createdAt: date(-7), updatedAt: date()
      },
      {
        id: "demo-reset-upcoming", templateId: "digital-reset", name: "Digital Reset", publicName: "21 days of clearer attention", why: "Reduce late-night scrolling and reclaim mornings.", outcome: "Better sleep and more protected focus.", startDate: date(0), endDate: date(20), duration: 21, pillars: ["Mental & Emotional", "Personal Growth"], status: "scheduled", accountability: "Flexible", intensity: "Balanced", restoreAllowance: 1, editAllowance: 1,
        commitments: [
          { id: "digital-limit", title: "Social media maximum 45 minutes", type: "limit", limitAmount: 45, limitUnit: "minutes", required: true, pillar: "Mental & Emotional" },
          { id: "digital-morning", title: "No phone for the first waking hour", type: "avoidance", required: true, pillar: "Mental & Emotional" },
          { id: "digital-journal", title: "Read or journal before bed", type: "daily", required: true, pillar: "Personal Growth", linkedFeature: "Journal" },
        ],
        activities: [], photos: [], changes: [], restores: [],
        share: { publicTitle: "21 days of clearer attention", showName: true, showDates: false, showStats: true, showMisses: false, showPhotos: false, showReflection: true, statement: "" },
        createdAt: date(-2), updatedAt: date(-2)
      },
      {
        id: "demo-reset-completed", templateId: "wellness-reset", name: "Wellness Reset", publicName: "30 days of returning to myself", why: "Recover steady sleep and movement after a busy season.", outcome: "A softer routine that still has structure.", startDate: date(-48), endDate: date(-19), duration: 30, pillars: ["Physical", "Mental & Emotional"], status: "completed", accountability: "Accountability", intensity: "Gentle", restoreAllowance: 0, editAllowance: 1,
        commitments: [
          { id: "wellness-sleep", title: "Seven-hour sleep opportunity", type: "daily", required: true, pillar: "Physical" },
          { id: "wellness-move", title: "Move three times per week", type: "weekly-quantity", targetPerWeek: 3, required: true, pillar: "Physical", linkedFeature: "Fitness" },
          { id: "wellness-reflect", title: "Evening reflection", type: "specific-days", scheduleDays: [1, 3, 5], required: true, pillar: "Mental & Emotional", linkedFeature: "Journal" },
        ],
        activities: Array.from({ length: 24 }, (_, i) => ({ id: `wellness-${i}`, commitmentId: i % 3 === 0 ? "wellness-move" : i % 3 === 1 ? "wellness-reflect" : "wellness-sleep", date: date(-48 + i), source: "reset" as const })),
        photos: [{ id: "wellness-photo", source: "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?auto=format&fit=crop&w=900&q=80", date: date(-48), label: "Starting photo" }],
        changes: [{ id: "wellness-complete", date: date(-19), day: 30, text: "Reset completed." }], restores: [], completionReflection: "I learned that gentle structure still counts.", completedAt: new Date(`${date(-19)}T18:00:00`).toISOString(),
        share: { publicTitle: "30 days of returning to myself", showName: true, showDates: true, showStats: true, showMisses: false, showPhotos: false, showReflection: true, statement: "Gentle structure still counts." },
        createdAt: date(-50), updatedAt: date(-19)
      }
    ],
  };
}
