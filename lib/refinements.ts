import type { LifeData } from "./life-store";
export type Classification = "Need" | "Want" | "Savings";
export type Review = { id: string; date: string; ratings: Record<string, number>; notes: string };
export type RefinementData = {
  goalWeight: number | null;
  fitnessPhotos: { id: string; date: string; title: string; image: string; notes: string }[];
  relationshipTypes: string[]; visionCategories: string[]; reviews: Review[];
  reviewSchedule: { frequency: "Weekly" | "Monthly" | "Quarterly"; enabled: boolean; start: string };
};
export function refinementDefaults(): RefinementData {
  return { goalWeight: null, fitnessPhotos: [], relationshipTypes: ["Family", "Friends", "Romantic", "Professional", "Mentors"], visionCategories: ["Career", "Health", "Fitness", "Relationships", "Finance", "Travel", "Spiritual Life", "Personal Growth"], reviews: [], reviewSchedule: { frequency: "Monthly", enabled: true, start: "" } };
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
export function nextReviewDate(date:string,frequency:string) {
  const d=new Date(`${date}T12:00:00`);if(Number.isNaN(d.getTime()))return "";
  if(frequency==="Weekly")d.setDate(d.getDate()+7);
  else {const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+(frequency==="Quarterly"?3:1));d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));}
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export function reviewDue(data:LifeData,date:string) {if(!data.reviewSchedule.enabled)return false;const latest=data.reviews.map(r=>r.date).sort().at(-1)??data.reviewSchedule.start;return !latest||nextReviewDate(latest,data.reviewSchedule.frequency)<=date;}
