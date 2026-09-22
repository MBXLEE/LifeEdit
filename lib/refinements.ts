import type { LifeData } from "./life-store";
export type Classification = "Need" | "Want" | "Savings";
export type Review = { id: string; date: string; ratings: Record<string, number>; notes: string };
export type DailyBudgetPlan = { id: string; date: string; category: string; amount: number; currency: string; note: string };
export type WeeklyBudgetPlan = { id: string; month: string; weekStart: string; weekEnd: string; amount: number; currency: string };
export type PillarSubcategory = { id: string; name: string; color: string };
export type PillarStyle = { pillar: string; color: string; subcategories: PillarSubcategory[] };
export type JournalRating = { id: string; journalId: string; pillar: string; rating: number; date: string };
export type ImprovementPlan = { id: string; pillar: string; score: number; createdAt: string; actions: string[] };
export type FinanceSettings = { payday: number; payFrequency: "Monthly" };
export type SpendingLimits = { daily: number; weekly: number; categories: Record<string, number> };
export type RefinementData = {
  goalWeight: number | null;
  financeSettings: FinanceSettings;
  fitnessPhotos: { id: string; date: string; title: string; image: string; notes: string }[];
  relationshipTypes: string[]; visionCategories: string[]; reviews: Review[];
  pillarStyles: PillarStyle[];
  spendingLimits: SpendingLimits;
  dailyBudgetPlans: DailyBudgetPlan[]; weeklyBudgetPlans: WeeklyBudgetPlan[]; journalRatings: JournalRating[]; improvementPlans: ImprovementPlan[];
  reviewSchedule: { frequency: "Weekly" | "Monthly" | "Quarterly"; enabled: boolean; start: string };
};
export function refinementDefaults(): RefinementData {
  return { goalWeight: null, financeSettings: { payday: 25, payFrequency: "Monthly" }, fitnessPhotos: [], relationshipTypes: ["Family", "Friends", "Romantic", "Professional", "Mentors"], visionCategories: ["Career", "Health", "Fitness", "Relationships", "Finance", "Travel", "Spiritual Life", "Personal Growth"], reviews: [], pillarStyles: defaultPillarStyles(), spendingLimits: { daily: 0, weekly: 0, categories: {} }, dailyBudgetPlans: [], weeklyBudgetPlans: [], journalRatings: [], improvementPlans: [], reviewSchedule: { frequency: "Monthly", enabled: true, start: "" } };
}
export function defaultPillarStyles(): PillarStyle[] {
  return [
    { pillar: "Financial", color: "#16a34a", subcategories: [{ id: "financial-budgeting", name: "Budgeting", color: "#86efac" }, { id: "financial-saving", name: "Saving", color: "#22c55e" }, { id: "financial-investing", name: "Investing", color: "#15803d" }] },
    { pillar: "Physical", color: "#2563eb", subcategories: [{ id: "physical-exercise", name: "Exercise", color: "#93c5fd" }, { id: "physical-gym", name: "Gym", color: "#3b82f6" }, { id: "physical-nutrition", name: "Nutrition", color: "#1d4ed8" }] },
    { pillar: "Mental & Emotional", color: "#9333ea", subcategories: [{ id: "mental-reflection", name: "Reflection", color: "#d8b4fe" }, { id: "mental-therapy", name: "Therapy", color: "#a855f7" }, { id: "mental-rest", name: "Rest", color: "#7e22ce" }] },
    { pillar: "Social", color: "#ec4899", subcategories: [{ id: "social-family", name: "Family", color: "#f9a8d4" }, { id: "social-friends", name: "Friends", color: "#f472b6" }, { id: "social-connection", name: "Connection", color: "#db2777" }] },
    { pillar: "Spiritual", color: "#0d9488", subcategories: [{ id: "spiritual-prayer", name: "Prayer", color: "#5eead4" }, { id: "spiritual-service", name: "Service", color: "#14b8a6" }, { id: "spiritual-study", name: "Study", color: "#0f766e" }] },
    { pillar: "Personal Growth", color: "#eab308", subcategories: [{ id: "growth-study-session", name: "Study Session", color: "#a16207" }, { id: "growth-reading", name: "Reading", color: "#fde68a" }, { id: "growth-skill-development", name: "Skill Development", color: "#facc15" }, { id: "growth-course-work", name: "Course Work", color: "#d97706" }] },
    { pillar: "Career", color: "#2563eb", subcategories: [{ id: "career-deep-work", name: "Deep Work", color: "#93c5fd" }, { id: "career-learning", name: "Learning", color: "#60a5fa" }, { id: "career-admin", name: "Admin", color: "#1d4ed8" }] },
    { pillar: "Health", color: "#22c55e", subcategories: [{ id: "health-walking", name: "Walking", color: "#bbf7d0" }, { id: "health-nutrition", name: "Nutrition", color: "#86efac" }, { id: "health-recovery", name: "Recovery", color: "#4ade80" }] },
    { pillar: "Relationships", color: "#f472b6", subcategories: [{ id: "relationships-family", name: "Family", color: "#fbcfe8" }, { id: "relationships-friends", name: "Friends", color: "#f9a8d4" }, { id: "relationships-date-night", name: "Date Night", color: "#ec4899" }] },
    { pillar: "Recreation", color: "#f97316", subcategories: [{ id: "recreation-play", name: "Play", color: "#fdba74" }, { id: "recreation-travel", name: "Travel", color: "#fb923c" }, { id: "recreation-hobbies", name: "Hobbies", color: "#ea580c" }] },
    { pillar: "Home", color: "#64748b", subcategories: [{ id: "home-reset", name: "Reset", color: "#cbd5e1" }, { id: "home-admin", name: "Admin", color: "#94a3b8" }, { id: "home-projects", name: "Projects", color: "#475569" }] }
  ];
}
type Transaction = LifeData["transactions"][number];
export const isSavings = (t: Transaction) => t.type !== "Income" && (t.type === "Savings" || t.type === "Investment" || t.classification === "Savings");
export function financialTotals(rows: Transaction[]) {
  const income=rows.filter(t=>t.type==="Income").reduce((s,t)=>s+t.amount,0);
  const savings=rows.filter(isSavings).reduce((s,t)=>s+t.amount,0);
  const expenses=rows.filter(t=>t.type!=="Income"&&!isSavings(t)).reduce((s,t)=>s+t.amount,0);
  return {income,expenses,savings,remaining:income-expenses-savings};
}
type DateRange = { start: string; end: string };
export function budgetAllocation(transactions: Transaction[], budgets: LifeData["budgets"], month: string, currency: string, range?: DateRange) {
  const cents = (amount: number) => Math.round(amount * 100);
  const limits = new Map<string, number>();
  for (const budget of budgets.filter(b => b.month === month && b.currency === currency)) {
    limits.set(budget.category, (limits.get(budget.category) ?? 0) + cents(budget.amount));
  }
  const spent = new Map<string, number>();
  let income = 0;
  for (const row of transactions.filter(t => (range ? t.date >= range.start && t.date <= range.end : t.date.startsWith(month)) && t.currency === currency)) {
    if (row.type === "Income") income += cents(row.amount);
    else spent.set(row.category, (spent.get(row.category) ?? 0) + cents(row.amount));
  }
  const reserved = [...limits.values()].reduce((sum, value) => sum + value, 0);
  let outside = 0, over = 0, inBudgets = 0;
  for (const [category, amount] of spent) {
    const limit = limits.get(category);
    if (limit === undefined) outside += amount;
    else { inBudgets += amount; over += Math.max(0, amount - limit); }
  }
  // Spending within a reserved budget must not reduce unallocated money twice.
  return { reserved: reserved / 100, unbudgeted: outside / 100, overspent: over / 100,
    remainingInBudgets: (reserved - inBudgets) / 100,
    available: (income - reserved - outside - over) / 100 };
}
export function classifications(rows: Transaction[]) {
  return rows.filter(t=>t.type!=="Income").reduce((s,t)=>{const key=isSavings(t)?"Savings":t.classification==="Need"||t.classification==="Want"?t.classification:"Unclassified";s[key]+=t.amount;return s;},{Need:0,Want:0,Savings:0,Unclassified:0});
}
function parseDay(date:string) { return new Date(`${date}T12:00:00`); }
function daysBetween(from:string,to:string) { return Math.round((parseDay(to).getTime()-parseDay(from).getTime())/86400000); }
function localDate(date:Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function addDays(date:string,days:number) { const d=parseDay(date);d.setDate(d.getDate()+days);return localDate(d); }
function monthDate(year:number, monthIndex:number, day:number) { return localDate(new Date(year, monthIndex, Math.min(Math.max(1, day), new Date(year, monthIndex + 1, 0).getDate()), 12)); }
function addMonths(date:string,months:number) { const d=parseDay(date); return monthDate(d.getFullYear(), d.getMonth() + months, d.getDate()); }
export function paydayCycleForDate(date:string,payday=25) {
  const cleanPayday = Math.min(31, Math.max(1, Math.round(Number(payday) || 25)));
  const current = parseDay(date);
  const thisPayday = monthDate(current.getFullYear(), current.getMonth(), cleanPayday);
  const start = date >= thisPayday ? thisPayday : monthDate(current.getFullYear(), current.getMonth() - 1, cleanPayday);
  const nextPayday = addMonths(start, 1);
  const end = addDays(nextPayday, -1);
  const periodDays = Math.max(1, daysBetween(start, nextPayday));
  const elapsedDays = Math.min(periodDays, Math.max(1, daysBetween(start, date) + 1));
  return { start, end, nextPayday, payday: cleanPayday, daysUntilPayday: Math.max(0, daysBetween(date, nextPayday)), periodDays, elapsedDays, budgetMonth: start.slice(0,7) };
}
function weekBounds(date:string) {
  const d=parseDay(date);
  const day=(d.getDay()+6)%7;
  const start=new Date(d);start.setDate(d.getDate()-day);
  const end=new Date(start);end.setDate(start.getDate()+6);
  return {start:localDate(start),end:localDate(end)};
}
function weeksInRange(startDate:string,endDate:string) {
  const weeks:{start:string;end:string;label:string}[]=[];
  for(let start=startDate;start<=endDate;start=addDays(start,7)) {
    const end=addDays(start,6)>endDate?endDate:addDays(start,6);
    weeks.push({start,end,label:`Week ${weeks.length+1}`});
  }
  return weeks;
}
export function dailyBudgetSummary(data:LifeData,date:string,currency=data.currency) {
  const cycle=paydayCycleForDate(date,data.financeSettings?.payday);
  const month=cycle.budgetMonth;
  const remainingDays=Math.max(1,daysBetween(date,cycle.nextPayday));
  const budgets=data.budgets.filter(b=>b.currency===currency&&b.month===month);
  const transactions=data.transactions.filter(t=>t.currency===currency&&t.date>=cycle.start&&t.date<=cycle.end&&t.type!=="Income");
  const actualToday=transactions.filter(t=>t.date===date).reduce((s,t)=>s+t.amount,0);
  const categories=budgets.map(b=>{
    const spentBeforeToday=transactions.filter(t=>t.category===b.category&&t.date<date).reduce((s,t)=>s+t.amount,0);
    const spentToday=transactions.filter(t=>t.category===b.category&&t.date===date).reduce((s,t)=>s+t.amount,0);
    const planned=data.dailyBudgetPlans.filter(p=>p.currency===currency&&p.date===date&&p.category===b.category).reduce((s,p)=>s+p.amount,0);
    const available=Math.max(0,(b.amount-spentBeforeToday)/remainingDays);
    return {category:b.category,budget:b.amount,available,planned,actual:spentToday,remaining:available-planned-spentToday};
  });
  const dailyBudget=categories.reduce((s,c)=>s+c.available,0);
  const plannedSpending=data.dailyBudgetPlans.filter(p=>p.currency===currency&&p.date===date).reduce((s,p)=>s+p.amount,0);
  return {date,currency,dailyBudget,plannedSpending,actualSpending:actualToday,remainingToday:dailyBudget-plannedSpending-actualToday,categories};
}
export function budgetGuidanceSummary(data:LifeData,date:string,currency=data.currency) {
  const cycle=paydayCycleForDate(date,data.financeSettings?.payday);
  const month=cycle.budgetMonth;
  const elapsedRatio=cycle.elapsedDays/cycle.periodDays;
  const calendarWeek=weekBounds(date);
  const start=calendarWeek.start<cycle.start?cycle.start:calendarWeek.start;
  const end=calendarWeek.end>cycle.end?cycle.end:calendarWeek.end;
  const budgets=data.budgets.filter(b=>b.currency===currency&&b.month===month);
  const budgetedCategories=new Set(budgets.map(b=>b.category));
  const monthlyBudget=budgets.reduce((s,b)=>s+b.amount,0);
  const transactions=data.transactions.filter(t=>t.currency===currency&&t.type!=="Income");
  const monthRows=transactions.filter(t=>t.date>=cycle.start&&t.date<=cycle.end);
  const weekRows=transactions.filter(t=>t.date>=start&&t.date<=end);
  const todayRows=transactions.filter(t=>t.date===date);
  const plannedToday=data.dailyBudgetPlans.filter(p=>p.currency===currency&&p.date===date).reduce((s,p)=>s+p.amount,0);
  const budgetedSpend=(rows:Transaction[])=>rows.filter(t=>budgetedCategories.has(t.category)).reduce((s,t)=>s+t.amount,0);
  const monthlySpent=budgetedSpend(monthRows);
  const weeklySpent=budgetedSpend(weekRows);
  const todaySpent=budgetedSpend(todayRows);
  const monthlyRemaining=monthlyBudget-monthlySpent;
  const monthWeeks=weeksInRange(cycle.start,cycle.end);
  const fallbackEnvelopeBudget=monthWeeks.length?monthlyBudget/monthWeeks.length:0;
  const plannedWeeks=data.weeklyBudgetPlans.filter(p=>p.currency===currency&&p.month===month);
  const amountForWeek=(week:{start:string;end:string})=>plannedWeeks.find(p=>p.weekStart===week.start&&p.weekEnd===week.end)?.amount ?? fallbackEnvelopeBudget;
  const currentMonthWeek=monthWeeks.find(week=>date>=week.start&&date<=week.end);
  const systemWeeklyBudget=currentMonthWeek?amountForWeek(currentMonthWeek):fallbackEnvelopeBudget;
  const weeklyBudget=data.spendingLimits?.weekly>0?data.spendingLimits.weekly:systemWeeklyBudget;
  const systemDailyTarget=Math.max(0,monthlyRemaining)/Math.max(1,cycle.daysUntilPayday || 1);
  const dailyTarget=data.spendingLimits?.daily>0?data.spendingLimits.daily:systemDailyTarget;
  const weekRemaining=weeklyBudget-weeklySpent;
  const todayRemaining=dailyTarget-todaySpent-plannedToday;
  const tomorrow=addDays(date,1);
  const remainingDaysAfterToday=Math.max(1,daysBetween(tomorrow,end)+1);
  const tomorrowSuggested=Math.max(0,weekRemaining/remainingDaysAfterToday);
  const expectedMonthSpend=monthlyBudget*elapsedRatio;
  const spendingVelocity=expectedMonthSpend>0?monthlySpent/expectedMonthSpend*100:0;
  const weekUsage=weeklyBudget>0?weeklySpent/weeklyBudget:0;
  const monthUsage=monthlyBudget>0?monthlySpent/monthlyBudget:0;
  const health=monthlyBudget<=0?"Create a monthly budget":monthUsage<elapsedRatio*.9?"Ahead of Goal":weekUsage>1.1||monthUsage>elapsedRatio*1.18?"Overspending Risk":weekUsage>1||todaySpent>dailyTarget?"Slightly Above Plan":"On Track";
  const insight=monthlyBudget<=0?"Create one pay-cycle budget and Life Edit will translate it into weekly and daily guidance.":todayRemaining>=0?`You can spend ${Math.round(todayRemaining)} more today and remain within your weekly plan.`:tomorrowSuggested>0?`Today ran above the daily target. Tomorrow's suggested spend is ${Math.round(tomorrowSuggested)} to keep the week steady.`:`This week is fully used. Any extra spending will draw from the rest of the pay cycle.`;
  const paceRemaining=monthlyBudget-monthlySpent/Math.max(elapsedRatio,1/cycle.periodDays);
  const projectedMonthEnd=Math.round(paceRemaining);
  const weekSavings=transactions.filter(t=>t.date>=start&&t.date<=end&&isSavings(t)).reduce((s,t)=>s+t.amount,0);
  const goalProgress=data.savingsGoals.filter(g=>!g.archived&&g.currency===currency&&g.target>0).slice(0,2).map(g=>({title:g.title,boost:weekSavings/g.target*100}));
  const weekEnvelopes=monthWeeks.map(week=>{
    const rows=monthRows.filter(t=>t.date>=week.start&&t.date<=week.end&&budgetedCategories.has(t.category));
    const spent=rows.reduce((s,t)=>s+t.amount,0);
    const scheduled=rows.filter(t=>t.date>date).reduce((s,t)=>s+t.amount,0);
    const budget=week.start===currentMonthWeek?.start?weeklyBudget:amountForWeek(week);
    return {...week,budget,systemBudget:amountForWeek(week),spent,scheduled,remaining:budget-spent,recommendedDaily:budget/Math.max(1,daysBetween(week.start,week.end)+1)};
  });
  return {date,currency,month,budgetMonth:month,cycleStart:cycle.start,cycleEnd:cycle.end,nextPayday:cycle.nextPayday,payday:cycle.payday,daysUntilPayday:cycle.daysUntilPayday,periodDays:cycle.periodDays,weekStart:start,weekEnd:end,monthlyBudget,monthlySpent,monthlyRemaining,weeklyBudget,systemWeeklyBudget,weeklySpent,weekRemaining,dailyTarget,systemDailyTarget,todaySpent,plannedToday,todayRemaining,tomorrowSuggested,health,insight,projectedMonthEnd,weekSavings,goalProgress,spendingVelocity,breathingRoom:monthlyRemaining,weekEnvelopes};
}
export function journalRatingStats(data:LifeData,pillar:string,date:string) {
  const rows=data.journalRatings.filter(r=>r.pillar===pillar&&r.date<=date).sort((a,b)=>a.date.localeCompare(b.date));
  const avg=(days:number)=>{const recent=rows.filter(r=>daysBetween(r.date,date)<days);return recent.length?Number((recent.reduce((s,r)=>s+r.rating,0)/recent.length).toFixed(1)):null;};
  const previous=data.journalRatings.filter(r=>r.pillar===pillar&&r.date<date).sort((a,b)=>a.date.localeCompare(b.date)).slice(-10,-5);
  const latest=rows.slice(-5);
  const recentAverage=latest.length?Number((latest.reduce((s,r)=>s+r.rating,0)/latest.length).toFixed(1)):null;
  const trend=previous.length&&latest.length?latest.reduce((s,r)=>s+r.rating,0)/latest.length-previous.reduce((s,r)=>s+r.rating,0)/previous.length:0;
  return {rows,weeklyAverage:avg(7),monthlyAverage:avg(30),quarterlyAverage:avg(90),recentAverage,trend:trend>0.35?"Improving":trend<-0.35?"Declining":rows.length?"Steady":"No ratings yet"};
}
export function improvementActions(pillar:string) {
  const actions:Record<string,string[]>={
    Financial:["Create or refine a monthly budget","Track spending against categories","Set a realistic savings goal"],
    Physical:["Plan workouts for the week","Track body progress or movement","Set one recovery or hydration goal"],
    "Mental & Emotional":["Schedule quiet reflection time","Journal emotional patterns","Plan one restorative activity"],
    Social:["Add important relationships","Create check-in reminders","Schedule a connection goal"],
    Spiritual:["Create a reflection rhythm","Track prayers or study plans","Protect a weekly spiritual practice"],
    "Personal Growth":["Choose one skill to build","Schedule focused learning time","Break a growth goal into next actions"]
  };
  return actions[pillar] ?? ["Choose one small action","Track progress weekly","Review what is working"];
}
export function generatedImprovementPlans(data:LifeData,date:string) {
  const stored=new Map(data.improvementPlans.map(p=>[p.pillar,p]));
  return Object.entries(data.assessment).filter(([,score])=>score>0&&score<=5).map(([pillar,score])=>stored.get(pillar)??{id:`generated-${pillar}`,pillar,score,createdAt:date,actions:improvementActions(pillar)});
}
export function nextReviewDate(date:string,frequency:string) {
  const d=new Date(`${date}T12:00:00`);if(Number.isNaN(d.getTime()))return "";
  if(frequency==="Weekly")d.setDate(d.getDate()+7);
  else {const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+(frequency==="Quarterly"?3:1));d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));}
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export function reviewDue(data:LifeData,date:string) {if(!data.reviewSchedule.enabled)return false;const latest=data.reviews.map(r=>r.date).sort().at(-1)??data.reviewSchedule.start;return !latest||nextReviewDate(latest,data.reviewSchedule.frequency)<=date;}
