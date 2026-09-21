import type { LifeData } from "./life-store";
export type Classification = "Need" | "Want" | "Savings";
export type Review = { id: string; date: string; ratings: Record<string, number>; notes: string };
export type DailyBudgetPlan = { id: string; date: string; category: string; amount: number; currency: string; note: string };
export type WeeklyBudgetPlan = { id: string; month: string; weekStart: string; weekEnd: string; amount: number; currency: string };
export type PillarSubcategory = { id: string; name: string; color: string };
export type PillarStyle = { pillar: string; color: string; subcategories: PillarSubcategory[] };
export type JournalRating = { id: string; journalId: string; pillar: string; rating: number; date: string };
export type ImprovementPlan = { id: string; pillar: string; score: number; createdAt: string; actions: string[] };
export type RefinementData = {
  goalWeight: number | null;
  fitnessPhotos: { id: string; date: string; title: string; image: string; notes: string }[];
  relationshipTypes: string[]; visionCategories: string[]; reviews: Review[];
  pillarStyles: PillarStyle[];
  dailyBudgetPlans: DailyBudgetPlan[]; weeklyBudgetPlans: WeeklyBudgetPlan[]; journalRatings: JournalRating[]; improvementPlans: ImprovementPlan[];
  reviewSchedule: { frequency: "Weekly" | "Monthly" | "Quarterly"; enabled: boolean; start: string };
};
export function refinementDefaults(): RefinementData {
  return { goalWeight: null, fitnessPhotos: [], relationshipTypes: ["Family", "Friends", "Romantic", "Professional", "Mentors"], visionCategories: ["Career", "Health", "Fitness", "Relationships", "Finance", "Travel", "Spiritual Life", "Personal Growth"], reviews: [], pillarStyles: defaultPillarStyles(), dailyBudgetPlans: [], weeklyBudgetPlans: [], journalRatings: [], improvementPlans: [], reviewSchedule: { frequency: "Monthly", enabled: true, start: "" } };
}
export function defaultPillarStyles(): PillarStyle[] {
  return [
    { pillar: "Financial", color: "#8b5cf6", subcategories: [{ id: "financial-budgeting", name: "Budgeting", color: "#c4b5fd" }, { id: "financial-saving", name: "Saving", color: "#a78bfa" }, { id: "financial-investing", name: "Investing", color: "#7c3aed" }] },
    { pillar: "Physical", color: "#16a34a", subcategories: [{ id: "physical-exercise", name: "Exercise", color: "#86efac" }, { id: "physical-gym", name: "Gym", color: "#15803d" }, { id: "physical-nutrition", name: "Nutrition", color: "#a7f3d0" }] },
    { pillar: "Mental & Emotional", color: "#0ea5e9", subcategories: [{ id: "mental-reflection", name: "Reflection", color: "#7dd3fc" }, { id: "mental-therapy", name: "Therapy", color: "#38bdf8" }, { id: "mental-rest", name: "Rest", color: "#bae6fd" }] },
    { pillar: "Social", color: "#ec4899", subcategories: [{ id: "social-family", name: "Family", color: "#f9a8d4" }, { id: "social-friends", name: "Friends", color: "#f472b6" }, { id: "social-connection", name: "Connection", color: "#db2777" }] },
    { pillar: "Spiritual", color: "#6366f1", subcategories: [{ id: "spiritual-prayer", name: "Prayer", color: "#a5b4fc" }, { id: "spiritual-service", name: "Service", color: "#818cf8" }, { id: "spiritual-study", name: "Study", color: "#4f46e5" }] },
    { pillar: "Personal Growth", color: "#d99b12", subcategories: [{ id: "growth-academic", name: "Academic", color: "#fde68a" }, { id: "growth-reading", name: "Reading", color: "#facc15" }, { id: "growth-skill-development", name: "Skill Development", color: "#f59e0b" }, { id: "growth-courses", name: "Courses", color: "#b45309" }] },
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
export function budgetAllocation(transactions: Transaction[], budgets: LifeData["budgets"], month: string, currency: string) {
  const cents = (amount: number) => Math.round(amount * 100);
  const limits = new Map<string, number>();
  for (const budget of budgets.filter(b => b.month === month && b.currency === currency)) {
    limits.set(budget.category, (limits.get(budget.category) ?? 0) + cents(budget.amount));
  }
  const spent = new Map<string, number>();
  let income = 0;
  for (const row of transactions.filter(t => t.date.startsWith(month) && t.currency === currency)) {
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
function daysInMonth(month:string) { return new Date(Number(month.slice(0,4)), Number(month.slice(5)), 0).getDate(); }
function daysBetween(from:string,to:string) { return Math.round((parseDay(to).getTime()-parseDay(from).getTime())/86400000); }
function localDate(date:Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function addDays(date:string,days:number) { const d=parseDay(date);d.setDate(d.getDate()+days);return localDate(d); }
function weekBounds(date:string) {
  const d=parseDay(date);
  const day=(d.getDay()+6)%7;
  const start=new Date(d);start.setDate(d.getDate()-day);
  const end=new Date(start);end.setDate(start.getDate()+6);
  return {start:localDate(start),end:localDate(end)};
}
function weeksInMonth(month:string) {
  const days=daysInMonth(month);
  const weeks:{start:string;end:string;label:string}[]=[];
  for(let day=1;day<=days;day+=7) {
    const start=`${month}-${String(day).padStart(2,"0")}`;
    const end=`${month}-${String(Math.min(days,day+6)).padStart(2,"0")}`;
    weeks.push({start,end,label:`Week ${weeks.length+1}`});
  }
  return weeks;
}
export function dailyBudgetSummary(data:LifeData,date:string,currency=data.currency) {
  const month=date.slice(0,7);
  const day=Number(date.slice(8,10));
  const remainingDays=Math.max(1,daysInMonth(month)-day+1);
  const budgets=data.budgets.filter(b=>b.currency===currency&&b.month===month);
  const transactions=data.transactions.filter(t=>t.currency===currency&&t.date.startsWith(month)&&t.type!=="Income");
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
  const month=date.slice(0,7);
  const day=Number(date.slice(8,10));
  const monthDays=daysInMonth(month);
  const elapsedRatio=day/monthDays;
  const {start,end}=weekBounds(date);
  const budgets=data.budgets.filter(b=>b.currency===currency&&b.month===month);
  const budgetedCategories=new Set(budgets.map(b=>b.category));
  const monthlyBudget=budgets.reduce((s,b)=>s+b.amount,0);
  const transactions=data.transactions.filter(t=>t.currency===currency&&t.type!=="Income");
  const monthRows=transactions.filter(t=>t.date.startsWith(month));
  const weekRows=transactions.filter(t=>t.date>=start&&t.date<=end&&t.date.startsWith(month));
  const todayRows=transactions.filter(t=>t.date===date);
  const plannedToday=data.dailyBudgetPlans.filter(p=>p.currency===currency&&p.date===date).reduce((s,p)=>s+p.amount,0);
  const budgetedSpend=(rows:Transaction[])=>rows.filter(t=>budgetedCategories.has(t.category)).reduce((s,t)=>s+t.amount,0);
  const monthlySpent=budgetedSpend(monthRows);
  const weeklySpent=budgetedSpend(weekRows);
  const todaySpent=budgetedSpend(todayRows);
  const monthWeeks=weeksInMonth(month);
  const fallbackEnvelopeBudget=monthWeeks.length?monthlyBudget/monthWeeks.length:0;
  const plannedWeeks=data.weeklyBudgetPlans.filter(p=>p.currency===currency&&p.month===month);
  const amountForWeek=(week:{start:string;end:string})=>plannedWeeks.find(p=>p.weekStart===week.start&&p.weekEnd===week.end)?.amount ?? fallbackEnvelopeBudget;
  const currentMonthWeek=monthWeeks.find(week=>date>=week.start&&date<=week.end);
  const weeklyBudget=currentMonthWeek?amountForWeek(currentMonthWeek):fallbackEnvelopeBudget;
  const dailyTarget=weeklyBudget/7;
  const weekRemaining=weeklyBudget-weeklySpent;
  const todayRemaining=dailyTarget-todaySpent-plannedToday;
  const tomorrow=addDays(date,1);
  const remainingDaysAfterToday=Math.max(1,daysBetween(tomorrow,end)+1);
  const tomorrowSuggested=Math.max(0,weekRemaining/remainingDaysAfterToday);
  const monthlyRemaining=monthlyBudget-monthlySpent;
  const expectedMonthSpend=monthlyBudget*elapsedRatio;
  const spendingVelocity=expectedMonthSpend>0?monthlySpent/expectedMonthSpend*100:0;
  const weekUsage=weeklyBudget>0?weeklySpent/weeklyBudget:0;
  const monthUsage=monthlyBudget>0?monthlySpent/monthlyBudget:0;
  const health=monthlyBudget<=0?"Create a monthly budget":monthUsage<elapsedRatio*.9?"Ahead of Goal":weekUsage>1.1||monthUsage>elapsedRatio*1.18?"Overspending Risk":weekUsage>1||todaySpent>dailyTarget?"Slightly Above Plan":"On Track";
  const insight=monthlyBudget<=0?"Create one monthly budget and Life Edit will translate it into weekly and daily guidance.":todayRemaining>=0?`You can spend ${Math.round(todayRemaining)} more today and remain within your weekly plan.`:tomorrowSuggested>0?`Today ran above the daily target. Tomorrow's suggested spend is ${Math.round(tomorrowSuggested)} to keep the week steady.`:`This week is fully used. Any extra spending will draw from the rest of the month.`;
  const paceRemaining=monthlyBudget-monthlySpent/Math.max(elapsedRatio,1/monthDays);
  const projectedMonthEnd=Math.round(paceRemaining);
  const weekSavings=transactions.filter(t=>t.date>=start&&t.date<=end&&isSavings(t)).reduce((s,t)=>s+t.amount,0);
  const goalProgress=data.savingsGoals.filter(g=>!g.archived&&g.currency===currency&&g.target>0).slice(0,2).map(g=>({title:g.title,boost:weekSavings/g.target*100}));
  const weekEnvelopes=monthWeeks.map(week=>{
    const rows=monthRows.filter(t=>t.date>=week.start&&t.date<=week.end&&budgetedCategories.has(t.category));
    const spent=rows.reduce((s,t)=>s+t.amount,0);
    const scheduled=rows.filter(t=>t.date>date).reduce((s,t)=>s+t.amount,0);
    const budget=amountForWeek(week);
    return {...week,budget,spent,scheduled,remaining:budget-spent,recommendedDaily:budget/Math.max(1,daysBetween(week.start,week.end)+1)};
  });
  return {date,currency,month,weekStart:start,weekEnd:end,monthlyBudget,monthlySpent,monthlyRemaining,weeklyBudget,weeklySpent,weekRemaining,dailyTarget,todaySpent,plannedToday,todayRemaining,tomorrowSuggested,health,insight,projectedMonthEnd,weekSavings,goalProgress,spendingVelocity,breathingRoom:monthlyRemaining,weekEnvelopes};
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
