import type { LifeData } from "./life-store";
export type Classification = "Need" | "Want" | "Savings";
export type Review = { id: string; date: string; ratings: Record<string, number>; notes: string };
export type DailyBudgetPlan = { id: string; date: string; category: string; amount: number; currency: string; note: string };
export type JournalRating = { id: string; journalId: string; pillar: string; rating: number; date: string };
export type ImprovementPlan = { id: string; pillar: string; score: number; createdAt: string; actions: string[] };
export type RefinementData = {
  goalWeight: number | null;
  fitnessPhotos: { id: string; date: string; title: string; image: string; notes: string }[];
  relationshipTypes: string[]; visionCategories: string[]; reviews: Review[];
  dailyBudgetPlans: DailyBudgetPlan[]; journalRatings: JournalRating[]; improvementPlans: ImprovementPlan[];
  reviewSchedule: { frequency: "Weekly" | "Monthly" | "Quarterly"; enabled: boolean; start: string };
};
export function refinementDefaults(): RefinementData {
  return { goalWeight: null, fitnessPhotos: [], relationshipTypes: ["Family", "Friends", "Romantic", "Professional", "Mentors"], visionCategories: ["Career", "Health", "Fitness", "Relationships", "Finance", "Travel", "Spiritual Life", "Personal Growth"], reviews: [], dailyBudgetPlans: [], journalRatings: [], improvementPlans: [], reviewSchedule: { frequency: "Monthly", enabled: true, start: "" } };
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
