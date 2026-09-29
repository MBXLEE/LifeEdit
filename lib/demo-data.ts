import type { LifeData } from "./life-store";
import { localDate } from "./life-domain";
import { paydayCycleForDate } from "./refinements";

const demoNow = new Date("2026-09-28T12:00:00");
const pillars = ["Financial", "Physical", "Mental & Emotional", "Social", "Spiritual", "Personal Growth"];

export function createDemoData(base: LifeData, now = demoNow): LifeData {
  const date = (offset = 0) => { const d = new Date(now); d.setDate(d.getDate() + offset); return localDate(d.getTime()); };
  const monthDate = (monthsAgo: number, day: number) => { const d = new Date(now); d.setMonth(d.getMonth() - monthsAgo); d.setDate(day); return localDate(d.getTime()); };
  const monthKey = (monthsAgo: number) => monthDate(monthsAgo, 25).slice(0, 7);
  const monthly = (start: string) => ({ recurring: true as const, recurrenceFrequency: "Monthly" as const, recurrenceInterval: 1, recurrenceStart: start });
  const assessment = { Financial: 7.2, Physical: 8.1, "Mental & Emotional": 7.5, Social: 6.8, Spiritual: 8.7, "Personal Growth": 8.0 };
  const categories = ["Rent", "Car", "Utilities", "Groceries", "Family", "Credit Card", "Loan", "Store Cards", "Wifi", "Gym", "Petrol", "Car Insurance", "Phone Insurance", "Policies", "Beauty Maintenance", "Fun", "Emergency Fund", "Travel Fund", "Course", "Books", "Eating Out", "Church Giving"];
  const budgetRows = [
    ["Rent", 5500], ["Car", 3000], ["Utilities", 1200], ["Groceries", 2200], ["Family", 1000], ["Credit Card", 700], ["Loan", 900], ["Wifi", 300], ["Gym", 800], ["Petrol", 1400], ["Car Insurance", 650], ["Phone Insurance", 200], ["Policies", 200], ["Beauty Maintenance", 900], ["Fun", 1000], ["Emergency Fund", 1800], ["Travel Fund", 700], ["Course", 350], ["Books", 250], ["Eating Out", 650], ["Church Giving", 500]
  ] as const;
  const budgets = [0, 1, 2, 3, 4, 5].flatMap(monthsAgo => budgetRows.map(([category, amount]) => ({ id: `demo-budget-${monthsAgo}-${category.toLowerCase().replaceAll(" ", "-")}`, category, amount, currency: "ZAR", month: monthKey(monthsAgo) })));
  const tx = (id: string, title: string, type: string, category: string, amount: number, day: string, classification: "" | "Need" | "Want" | "Savings" = "Need", paid = true, recurring = false) => ({
    id, title, type, category, amount, classification: type === "Income" ? undefined : classification, currency: "ZAR", date: day,
    dueDate: type !== "Income" ? day : undefined, paid: type !== "Income" ? paid : undefined, paidDate: paid && type !== "Income" ? day : undefined,
    status: type !== "Income" ? (paid ? "Paid" as const : "Upcoming" as const) : undefined, ...(recurring ? monthly(day) : {})
  });
  const transactions = [0, 1, 2, 3, 4, 5].flatMap(monthsAgo => {
    const paid = monthsAgo > 0;
    const suffix = `${monthsAgo}`;
    return [
      tx(`demo-income-${suffix}`, "Net Salary", "Income", "Income", 20000, monthDate(monthsAgo, 25), "", true, monthsAgo === 0),
      tx(`demo-rent-${suffix}`, "Rent", "Expense", "Rent", 5500, monthDate(monthsAgo, 25), "Need", paid, monthsAgo === 0),
      tx(`demo-car-${suffix}`, "Car Payment", "Expense", "Car", 3000, monthDate(monthsAgo, 26), "Need", paid, monthsAgo === 0),
      tx(`demo-utilities-${suffix}`, "Utilities", "Expense", "Utilities", 1200 + (monthsAgo % 2) * 90, monthDate(monthsAgo, 28), "Need", paid, monthsAgo === 0),
      tx(`demo-wifi-${suffix}`, "WiFi", "Expense", "Wifi", 300, monthDate(monthsAgo, 1), "Need", paid, monthsAgo === 0),
      tx(`demo-gym-${suffix}`, "Gym Membership", "Expense", "Gym", 800, monthDate(monthsAgo, 2), "Want", paid, monthsAgo === 0),
      tx(`demo-insurance-${suffix}`, "Car Insurance", "Expense", "Car Insurance", 650, monthDate(monthsAgo, 3), "Need", paid, monthsAgo === 0),
      tx(`demo-phone-insurance-${suffix}`, "Phone Insurance", "Expense", "Phone Insurance", 200, monthDate(monthsAgo, 4), "Need", paid, monthsAgo === 0),
      tx(`demo-policies-${suffix}`, "Policies", "Expense", "Policies", 200, monthDate(monthsAgo, 5), "Need", paid, monthsAgo === 0),
      tx(`demo-groceries-a-${suffix}`, "Monthly Grocery Shop", "Expense", "Groceries", 1250 + monthsAgo * 20, monthDate(monthsAgo, 27), "Need", paid),
      tx(`demo-groceries-b-${suffix}`, "Mid-month Groceries", "Expense", "Groceries", 780 + monthsAgo * 15, monthDate(monthsAgo, 12), "Need", paid),
      tx(`demo-petrol-a-${suffix}`, "Petrol Fill Up", "Expense", "Petrol", 760, monthDate(monthsAgo, 29), "Need", paid),
      tx(`demo-petrol-b-${suffix}`, "Petrol Top Up", "Expense", "Petrol", 560, monthDate(monthsAgo, 14), "Need", paid),
      tx(`demo-family-${suffix}`, "Family Support", "Expense", "Family", 1000, monthDate(monthsAgo, 30), "Need", paid),
      tx(`demo-credit-${suffix}`, "Credit Card Payment", "Expense", "Credit Card", 700, monthDate(monthsAgo, 6), "Need", paid),
      tx(`demo-loan-${suffix}`, "Student Loan", "Expense", "Loan", 900, monthDate(monthsAgo, 7), "Need", paid),
      tx(`demo-emergency-${suffix}`, "Emergency Fund Transfer", "Savings", "Emergency Fund", 1200 + Math.max(0, 5 - monthsAgo) * 120, monthDate(monthsAgo, 8), "Savings", paid),
      tx(`demo-travel-${suffix}`, "Travel Fund Transfer", "Savings", "Travel Fund", 450, monthDate(monthsAgo, 9), "Savings", paid),
      tx(`demo-course-${suffix}`, "Data Analytics Course", "Expense", "Course", 350, monthDate(monthsAgo, 10), "Want", paid),
      tx(`demo-books-${suffix}`, "Books and Learning", "Expense", "Books", 180 + monthsAgo * 10, monthDate(monthsAgo, 16), "Want", paid),
      tx(`demo-fun-${suffix}`, "Dinner and Coffee", "Expense", "Eating Out", 420 + monthsAgo * 25, monthDate(monthsAgo, 18), "Want", paid),
      tx(`demo-giving-${suffix}`, "Church Giving", "Giving", "Church Giving", 500, monthDate(monthsAgo, 20), "Savings", paid),
      tx(`demo-beauty-${suffix}`, "Beauty Maintenance", "Expense", "Beauty Maintenance", 650, monthDate(monthsAgo, 21), "Want", paid),
    ];
  });
  const weeklyBudgetPlans = [0, 1, 2, 3, 4, 5].flatMap(monthsAgo => {
    const c = paydayCycleForDate(monthDate(monthsAgo, 28), 25);
    return [0, 1, 2, 3].map(i => ({ id: `demo-week-${monthsAgo}-${i}`, month: c.budgetMonth, weekStart: dateFrom(c.start, i * 7), weekEnd: i === 3 ? c.end : dateFrom(c.start, i * 7 + 6), amount: [6200, 4300, 3900, 4300][i], currency: "ZAR" }));
  });
  const dailyBudgetPlans = [-5, -4, -3, -2, -1, 0, 1, 2, 3].map((offset, i) => ({ id: `demo-daily-${i}`, date: date(offset), category: ["Groceries", "Petrol", "Eating Out", "Books"][i % 4], amount: [160, 250, 120, 90][i % 4], actualAmount: i < 6 ? [145, 260, 98, 110][i % 4] : 0, completed: i < 6, currency: "ZAR", note: ["Lunch prep", "Fuel top-up", "Coffee with friend", "Course notebook"][i % 4] }));
  const tasks = buildTasks(date, monthDate);
  const journals = buildJournals(date);
  const journalRatings = journals.map((j, i) => ({ id: `demo-rating-${i}`, journalId: j.id, pillar: j.pillar, rating: ratingFor(j.pillar, i), date: j.date }));
  const reviews = [5, 4, 3, 2, 1, 0].map(monthsAgo => ({
    id: `demo-review-${monthsAgo}`, date: monthDate(monthsAgo, 24),
    ratings: Object.fromEntries(pillars.map((pillar, i) => [pillar, Number((((assessment as Record<string, number>)[pillar] ?? 7) - monthsAgo * 0.18 + (i % 2) * 0.08).toFixed(1))])),
    notes: monthsAgo ? "Monthly reset completed. Progress is steady, especially around routines and money awareness." : "September reset: first job routines feel more stable, but social connection needs more intention."
  }));
  const exercise = (id: string, name: string, category: string, sets = 3, reps = 10, weight = 0, seconds = 0) => ({ id, name, category, sets, reps, weight, rest: 60, seconds, notes: "" });
  const workouts = [
    { id: "demo-workout-upper", name: "Upper Body Strength", category: "Upper Body", warmup: "Band pull-aparts and shoulder circles", cooldown: "Chest and lat stretch", notes: "Progressive overload focus.", archived: false, exercises: [exercise("ex-bench", "Bench Press", "Upper Body", 3, 8, 32), exercise("ex-row", "Seated Row", "Upper Body", 3, 10, 28), exercise("ex-press", "Shoulder Press", "Upper Body", 3, 10, 14)] },
    { id: "demo-workout-lower", name: "Lower Body Strength", category: "Lower Body", warmup: "Glute bridges and bodyweight squats", cooldown: "Hamstring stretch", notes: "Keep form clean.", archived: false, exercises: [exercise("ex-squat", "Squats", "Lower Body", 4, 8, 42), exercise("ex-rdl", "Romanian Deadlifts", "Lower Body", 3, 10, 34), exercise("ex-lunge", "Lunges", "Lower Body", 3, 12, 12)] },
    { id: "demo-workout-core", name: "Core and Mobility", category: "Core", warmup: "Easy walk", cooldown: "Breathing reset", notes: "Recovery friendly.", archived: false, exercises: [exercise("ex-plank", "Plank", "Core", 3, 0, 0, 45), exercise("ex-deadbug", "Dead Bug", "Core", 3, 10), exercise("ex-mobility", "Hip Mobility", "Mobility", 1, 0, 0, 60)] },
  ];
  const workoutLogs = Array.from({ length: 42 }, (_, i) => {
    const workout = workouts[i % workouts.length];
    return { id: `demo-workout-log-${i}`, name: workout.name, date: date(-118 + i * 3), minutes: [45, 50, 30][i % 3], volume: 650 + i * 18, exercises: workout.exercises, notes: i % 5 === 0 ? "Felt stronger than last week." : "Completed planned session." };
  });
  const measurements = [120, 90, 60, 30, 0].map((daysAgo, i) => ({ id: `demo-measurement-${i}`, date: date(-daysAgo), weight: [72, 70.8, 69.7, 68.9, 68][i], waist: [82, 80.5, 79.4, 78.6, 78][i], chest: [94, 94, 94.5, 95, 95][i], hips: [99, 98.4, 98, 97.5, 97][i], notes: i ? "Measured after morning routine." : "Starting point for first full-time job season." }));
  const relationships = [
    { id: "rel-mom", name: "Nandi Williams", type: "Family", importance: "Mother", birthday: "1978-05-14", lastContact: date(-2), followUp: date(3), goal: "Call twice a week", notes: "Encourages Ava's faith and career growth.", archived: false, memories: "Sunday lunch after church.", giftIdeas: "Spa voucher, framed family photo", conversations: "Talked about work confidence and budgeting." },
    { id: "rel-friend", name: "Lerato Mokoena", type: "Friends", importance: "Best Friend", birthday: "2003-02-20", lastContact: date(-5), followUp: date(2), goal: "Monthly coffee catch-up", notes: "University friend. Good emotional support.", archived: false, dateIdeas: "Coffee walk, art market", conversations: "Shared goals for Q4." },
    { id: "rel-sister", name: "Thandi Williams", type: "Family", importance: "Sister", birthday: "2008-09-09", lastContact: date(-1), followUp: date(6), goal: "Help with study planning", notes: "Matric year, appreciates check-ins.", archived: false, giftIdeas: "Study planner, headphones" },
    { id: "rel-romantic", name: "Daniel M.", type: "Romantic", importance: "Dating intentionally", birthday: "2001-12-01", lastContact: date(-4), followUp: date(5), goal: "Keep communication clear and slow", notes: "Met through church friends.", archived: false, dateIdeas: "Saturday hike, bookstore date" },
    { id: "rel-mentor", name: "Priya Naidoo", type: "Mentors", importance: "Career Mentor", birthday: "1989-07-18", lastContact: date(-10), followUp: date(1), goal: "Monthly career check-in", notes: "Data team senior analyst.", archived: false, conversations: "Discussed certification portfolio project." },
  ];
  const habitDates = (startOffset: number, missEvery: number) => Array.from({ length: Math.abs(startOffset) + 1 }, (_, i) => date(startOffset + i)).filter((_, i) => i % missEvery !== 0);
  const habits = [
    { id: "habit-reading", name: "Read 20 minutes", direction: "build" as const, dates: habitDates(-64, 7), start: date(-64), setbacks: [] },
    { id: "habit-gym", name: "Gym or active recovery", direction: "build" as const, dates: habitDates(-72, 4), start: date(-72), setbacks: [] },
    { id: "habit-journal", name: "Journal reflection", direction: "build" as const, dates: habitDates(-80, 5), start: date(-80), setbacks: [] },
    { id: "habit-prayer", name: "Morning prayer", direction: "build" as const, dates: habitDates(-90, 6), start: date(-90), setbacks: [] },
    { id: "habit-hydration", name: "2L water", direction: "build" as const, dates: habitDates(-45, 8), start: date(-45), setbacks: [] },
    { id: "quit-energy", name: "Energy Drinks", direction: "quit" as const, dates: [], start: date(-38), setbacks: [{ date: `${date(-24)}T18:00:00.000Z`, note: "Bought one during a late work deadline. Swapped to water the next day." }] },
    { id: "quit-impulse", name: "Impulse Spending", direction: "quit" as const, dates: [], start: date(-19), setbacks: [{ date: `${date(-12)}T13:00:00.000Z`, note: "Unplanned takeaway after a stressful day. Added a planned fun envelope." }] },
  ];
  return {
    ...base, name: "Ava Williams", theme: "Ocean", onboarded: true, assessment,
    financeSettings: { payday: 25, payFrequency: "Monthly" }, allocation: { enabled: true, needs: 55, wants: 25, savings: 20 },
    categories, priorities: ["Physical", "Financial", "Personal Growth", "Spiritual"],
    identity: "Confident, financially stable, spiritually consistent, healthy, disciplined, and kind.",
    vision: "I am building a grounded young-professional life where my work grows, my faith stays central, my body feels strong, and my money creates options instead of stress.",
    mission: "Use this first full-time job season to build wise routines: save before spending, train consistently, deepen faith, invest in relationships, and keep learning data skills.",
    lifestyle: "Ava is 23, a graduate trainee and junior professional. Weekdays are structured around work, gym, online learning, budgeting, prayer, and simple evenings. Weekends include church, family, friendships, errands, and monthly reset routines.",
    reviews, reviewSchedule: { frequency: "Monthly", enabled: true, start: monthDate(5, 24) }, tasks, habits, journals, journalRatings,
    goals: [
      { id: "goal-emergency", title: "Build R20,000 emergency fund", horizon: "Annual", parent: "", pillars: ["Financial"], progress: 43, archived: false, due: date(170), notes: "Current: R8,500 saved. Milestones: R10k by November, R15k by February, R20k by May." },
      { id: "goal-cert", title: "Complete Data Analytics Certification", horizon: "Quarterly", parent: "", pillars: ["Personal Growth"], progress: 62, archived: false, due: date(75), notes: "Portfolio project in progress. Finish SQL module, dashboard case study, and final assessment." },
      { id: "goal-gym", title: "Gym 4x weekly", horizon: "Monthly", parent: "", pillars: ["Physical"], progress: 78, archived: false, due: date(31), notes: "Average is 3-4 sessions. Add Sunday mobility to support recovery." },
      { id: "goal-books", title: "Read 12 books this year", horizon: "Annual", parent: "", pillars: ["Personal Growth"], progress: 58, archived: false, due: date(95), notes: "7 books completed. Current book: Atomic Habits." },
      { id: "goal-faith", title: "Finish Psalms reading plan", horizon: "Quarterly", parent: "", pillars: ["Spiritual"], progress: 70, archived: false, due: date(60), notes: "Psalm 23 reflections were especially meaningful." },
      { id: "goal-relationships", title: "Intentional monthly relationship check-ins", horizon: "Quarterly", parent: "", pillars: ["Social"], progress: 55, archived: false, due: date(80), notes: "Mother and mentor are consistent. Need to schedule Lerato earlier." },
    ],
    transactions, budgets, dailyBudgetPlans, weeklyBudgetPlans, spendingLimits: { daily: 180, weekly: 4200, categories: { "Eating Out": 650, Fun: 1000 } },
    savingsGoals: [{ id: "saving-emergency", title: "Emergency fund", target: 20000, saved: 8500, currency: "ZAR", due: date(170), archived: false }, { id: "saving-travel", title: "Cape Town birthday trip", target: 6000, saved: 2450, currency: "ZAR", due: date(120), archived: false }],
    board: [
      { id: "board-career", title: "Data analyst portfolio", url: "", category: "Career", notes: "Build two polished case studies and publish them before certification ends.", goalId: "goal-cert", kind: "image", quote: "Evidence beats intention.", coachNote: "Next: clean the sales dashboard dataset." },
      { id: "board-health", title: "Strong and energetic", url: "", category: "Health", notes: "Gym 4x weekly, 68kg current, 65kg goal.", goalId: "goal-gym", kind: "image", quote: "Strong, steady, consistent.", coachNote: "Protect sleep on training days." },
      { id: "board-finance", title: "R20k emergency fund", url: "", category: "Finance", notes: "R8,500 saved toward R20,000.", goalId: "goal-emergency", kind: "money", target: 20000, saved: 8500, currency: "ZAR", quote: "Security creates options.", coachNote: "Keep the automatic transfer after payday." },
      { id: "board-travel", title: "Cape Town weekend", url: "", category: "Travel", notes: "Saving slowly for a birthday trip.", goalId: "saving-travel", kind: "money", target: 6000, saved: 2450, currency: "ZAR", quote: "Rest is part of the plan.", coachNote: "Book only after emergency fund milestone." },
      { id: "board-relationships", title: "Intentional friendships", url: "", category: "Relationships", notes: "Monthly coffee, family Sunday, mentor check-ins.", goalId: "goal-relationships", kind: "image", quote: "Connection needs a calendar.", coachNote: "Message Lerato by Wednesday." },
      { id: "board-growth", title: "12 books this year", url: "", category: "Personal Growth", notes: "Seven completed, five to go.", goalId: "goal-books", kind: "image", quote: "Read, apply, repeat.", coachNote: "Finish two chapters this weekend." },
    ],
    goalWeight: 65, fitnessPhotos: [{ id: "photo-start", date: date(-120), title: "Starting point", image: "", notes: "First progress check at 72kg." }, { id: "photo-current", date: date(-7), title: "September progress", image: "", notes: "Visible consistency after 3 months." }],
    workouts, workoutLogs, measurements, workoutTypes: ["Upper Body", "Lower Body", "Push", "Pull", "Legs", "Core", "Mobility", "Recovery"], relationships,
    focus: Array.from({ length: 24 }, (_, i) => ({ id: `focus-${i}`, name: i % 2 ? "Course Work" : "Deep Work", seconds: [1500, 1800, 2100][i % 3], date: date(-70 + i * 3) })),
    focusPlan: { id: "demo-focus-plan", name: "Data course sprint", focusMinutes: 25, breakMinutes: 5, sessions: 4, completed: 2, phase: "focus", running: false, endsAt: null, remaining: 1500 },
    prayers: [
      { id: "prayer-work", title: "Confidence at work", notes: "Asked for courage in meetings. Answered through good mentor feedback.", date: date(-42), answered: true, archived: false },
      { id: "prayer-family", title: "Family peace", notes: "Praying for patience and kindness at home.", date: date(-18), answered: false, archived: false },
      { id: "prayer-purpose", title: "Direction for career", notes: "Asking for clarity on analytics path.", date: date(-9), answered: false, archived: false },
      { id: "prayer-gratitude", title: "Gratitude for first job", notes: "Thankful for stable income and learning.", date: date(-2), answered: true, archived: false },
    ],
    studyPlans: [
      { id: "study-psalms", title: "Psalms reading plan", passage: "Psalm 1-50", notes: "Read, underline one verse, write one prayer.", progress: 70, date: date(-60), archived: false },
      { id: "study-proverbs", title: "Wisdom for money decisions", passage: "Proverbs 3, 10, 31", notes: "Connect scripture to budgeting and discipline.", progress: 40, date: date(-14), archived: false },
      { id: "study-romans", title: "Romans reflection", passage: "Romans 8", notes: "Journal identity and assurance.", progress: 20, date: date(), archived: false },
    ],
    improvementPlans: [
      { id: "plan-social", pillar: "Social", score: 6.8, createdAt: date(-20), actions: ["Schedule one friend catch-up", "Call Mom twice a week", "Book mentor check-in before month end"] },
      { id: "plan-financial", pillar: "Financial", score: 7.2, createdAt: date(-35), actions: ["Review budget every Sunday", "Keep emergency fund transfer automatic", "Limit eating out to planned envelope"] },
    ],
  };
}

function dateFrom(start: string, offset: number) {
  const d = new Date(`${start}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return localDate(d.getTime());
}

function buildTasks(date: (offset?: number) => string, monthDate: (monthsAgo: number, day: number) => string) {
  const currentWeek = [
    ["Gym after work", 0, "17:45", 60, "Physical", false], ["Complete online course lesson", 0, "19:30", 45, "Personal Growth", false], ["Review monthly budget", 0, "20:30", 25, "Financial", false], ["Bible reading", 0, "06:45", 20, "Spiritual", true],
    ["Graduate trainee stand-up", 1, "09:00", 30, "Personal Growth", false], ["Mentor check-in with Priya", 1, "16:00", 30, "Personal Growth", false], ["Family dinner", 5, "18:00", 120, "Social", false], ["Monthly reset", 2, "19:00", 60, "Mental & Emotional", false],
  ];
  const history = Array.from({ length: 56 }, (_, i) => {
    const offset = -112 + i * 2;
    const titles = ["Work meeting", "Gym session", "Study session", "Budget review", "Family visit", "Online course assignment", "Church service", "Meal prep"];
    const pillar = ["Personal Growth", "Physical", "Personal Growth", "Financial", "Social", "Personal Growth", "Spiritual", "Physical"][i % 8];
    return { id: `task-history-${i}`, title: titles[i % titles.length], date: date(offset), time: ["09:00", "17:30", "19:00", "18:30"][i % 4], minutes: [30, 60, 45, 25][i % 4], pillar, done: offset < 0 };
  });
  const monthly = [5, 4, 3, 2, 1, 0].flatMap(monthsAgo => [
    { id: `task-monthly-reset-${monthsAgo}`, title: "Monthly reset and life review", date: monthDate(monthsAgo, 24), time: "10:00", minutes: 75, pillar: "Mental & Emotional", done: monthsAgo > 0 },
    { id: `task-budget-close-${monthsAgo}`, title: "Budget close-out", date: monthDate(monthsAgo, 24), time: "12:00", minutes: 35, pillar: "Financial", done: monthsAgo > 0 },
  ]);
  return [...history, ...monthly, ...currentWeek.map(([title, offset, time, minutes, pillar, done], i) => ({ id: `task-current-${i}`, title: String(title), date: date(Number(offset)), time: String(time), minutes: Number(minutes), pillar: String(pillar), done: Boolean(done) }))];
}

function buildJournals(date: (offset?: number) => string) {
  const entries: Record<string, string[]> = {
    Financial: ["Reviewed my monthly budget after payday and felt proud that savings went out first.", "Groceries were higher than expected, but tracking it helped me adjust before it became a problem.", "Transferred money to the emergency fund and resisted ordering takeout.", "Compared wants vs needs and noticed beauty maintenance needs a clearer limit.", "Paid my credit card on time and updated the envelope plan.", "I can feel my confidence growing because money has a plan now."],
    Physical: ["Completed upper body workout after work. Energy was low at first but I finished strong.", "Lower body day felt hard, but my squat form is improving.", "Took a recovery walk instead of skipping movement completely.", "Meal prepped lunches and drank enough water today.", "Current weight is 68kg. I feel stronger than when I started.", "Core session was quick but helped my back after sitting at work."],
    "Mental & Emotional": ["Felt overwhelmed by work expectations, so I wrote down what is actually urgent.", "Took a quiet evening and it helped me reset.", "I am learning that rest is productive when it keeps me steady.", "Had a stressful commute but did not let it ruin the day.", "Named my emotions before journaling and felt more grounded.", "Monthly reset helped me see progress I was ignoring."],
    Social: ["Had a really good catch-up with Lerato today. It reminded me not to disappear when life gets busy.", "Called Mom after work and felt encouraged.", "Helped Thandi plan her study week. It felt good to be useful.", "Sent a voice note to Daniel instead of overthinking.", "Booked coffee with my mentor and prepared questions.", "Family lunch was simple but exactly what I needed."],
    Spiritual: ["Finished Psalm 23 and journaled reflections on being guided, not rushed.", "Prayed before work and felt calmer in the morning meeting.", "Church message challenged me to be consistent in small things.", "Wrote a gratitude list and noticed how much provision is already here.", "Read Proverbs and connected it to spending wisely.", "Evening prayer helped me release the pressure to prove myself."],
    "Personal Growth": ["Completed another data analytics lesson and took notes for my portfolio.", "Read two chapters before bed instead of scrolling.", "Practiced SQL joins until they finally clicked.", "Asked for feedback at work and wrote down the advice.", "Updated my certification tracker and planned the final project.", "I am becoming the kind of person who follows through."],
  };
  let idx = 0;
  return pillars.flatMap((pillar, pIndex) => entries[pillar].map((body, i) => ({ id: `journal-${idx++}`, title: `${pillar} reflection ${i + 1}`, template: `pillar-${pIndex}`, pillar, body, date: date(-116 + pIndex * 3 + i * 18) })));
}

function ratingFor(pillar: string, index: number) {
  const base: Record<string, number> = { Financial: 7, Physical: 8, "Mental & Emotional": 7, Social: 7, Spiritual: 9, "Personal Growth": 8 };
  return Math.max(5, Math.min(10, (base[pillar] ?? 7) + (index % 3 === 0 ? 1 : index % 4 === 0 ? -1 : 0)));
}
