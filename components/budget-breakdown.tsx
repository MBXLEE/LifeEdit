"use client";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { LifeData } from "@/lib/life-store";
import { financeEventDate, isPlannedFinanceTransaction } from "@/lib/refinements";
import { Button,Card,Empty,Metric,Progress,RecordActions } from "./workspace-ui";

type Transaction=LifeData["transactions"][number];
type Budget=LifeData["budgets"][number];
export function BudgetBreakdown({budgets,entries,money,categoryLimits={},plannedItems=[],activeDate,addBudget,editBudget,deleteBudget,addSpending,editTransaction,deleteTransaction,togglePaid}:{
  budgets:Budget[];entries:Transaction[];money:(value:number)=>string;
  categoryLimits?:Record<string,number>;plannedItems?:LifeData["dailyBudgetPlans"];activeDate:string;
  addBudget:()=>void;editBudget:(budget:Budget)=>void;deleteBudget:(id:string)=>void;
  addSpending:(category:string)=>void;editTransaction:(transaction:Transaction)=>void;deleteTransaction:(id:string)=>void;
  togglePaid:(transaction:Transaction,paid:boolean)=>void;
}) {
  const [selected,setSelected]=useState<string|null>(null);
  const detailRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(selected)detailRef.current?.scrollIntoView({block:"center",behavior:"smooth"});},[selected]);
  const outgoings=entries.filter(t=>t.type!=="Income");
  const rows=budgets.map(b=>{
    const categoryRows=outgoings.filter(t=>t.category===b.category);
    const spent=categoryRows.filter(t=>!isPlannedFinanceTransaction(t,activeDate)).reduce((s,t)=>s+t.amount,0);
    const reserved=categoryRows.filter(t=>isPlannedFinanceTransaction(t,activeDate)).reduce((s,t)=>s+t.amount,0)+plannedItems.filter(p=>p.category===b.category).reduce((s,p)=>s+p.amount,0);
    return {...b,limit:categoryLimits[b.category]>0?categoryLimits[b.category]:b.amount,spent,reserved};
  });
  const allocated=rows.reduce((s,b)=>s+b.limit,0),spent=rows.reduce((s,b)=>s+b.spent,0),reserved=rows.reduce((s,b)=>s+b.reserved,0);
  const unbudgeted=outgoings.filter(t=>!budgets.some(b=>b.category===t.category)).reduce((s,t)=>s+t.amount,0);
  return <><div className="le-row mb-5"><h2>Pay-cycle spending breakdown</h2><Button onClick={addBudget}><Plus size={16}/>Add budget</Button></div>
    <div className="le-grid-four mb-6"><Metric label="Total budgeted" value={money(allocated)}/><Metric label="Spent in budgeted categories" value={money(spent)} color="#c9616b"/><Metric label="Reserved" value={money(reserved)} color="#c69a42"/><Metric label="Available in budgets" value={money(allocated-spent-reserved)} color={spent+reserved>allocated?"#c9616b":"#4a926b"}/></div>
    {unbudgeted>0&&<p role="status" className="mb-5">{money(unbudgeted)} recorded outside your budgeted categories.</p>}
    <Card><div className="le-table-scroll"><table><thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Reserved</th><th>Available</th><th>Budget used</th><th>Actions</th></tr></thead><tbody>{rows.map(b=>{const committed=b.spent+b.reserved;return <tr key={b.id}><th><button type="button" className="le-table-category" onClick={()=>setSelected(b.category)}>{b.category}</button>{b.limit!==b.amount&&<small className="le-muted">Budget {money(b.amount)}</small>}</th><td>{money(b.limit)}</td><td><button type="button" className="le-table-amount" aria-label={`View ${b.category} spending`} onClick={()=>setSelected(b.category)}>{money(b.spent)}</button></td><td>{money(b.reserved)}</td><td style={{color:committed>b.limit?"#c9616b":"#4a926b"}}>{money(b.limit-committed)}</td><td><Progress value={b.limit?committed/b.limit*100:0}/><small>{b.limit?(committed/b.limit*100).toFixed(0):0}%{committed>b.limit?` · ${money(committed-b.limit)} over budget`:committed>=b.limit*.9?" · Near limit":""}</small></td><td><div className="le-inline"><button type="button" className="le-icon" title={`Record ${b.category} spending`} aria-label={`Record ${b.category} spending`} onClick={()=>addSpending(b.category)}><Plus size={16}/></button><RecordActions name={`${b.category} budget`} edit={()=>editBudget(b)} remove={()=>deleteBudget(b.id)}/></div></td></tr>;})}</tbody></table></div>{!rows.length&&<Empty title="No budgets for this pay cycle." action="Create budget" onClick={addBudget}/>}</Card>
    {selected&&<div ref={detailRef}><Card className="mt-6"><div className="le-row"><h2>{selected} spending</h2><Button onClick={()=>addSpending(selected)}><Plus size={16}/>Record spending</Button></div>{outgoings.filter(t=>t.category===selected).map(t=><div className={`le-row le-log ${t.paid?"is-paid":""}`} key={t.id}><div><strong>{t.title}</strong><p className="le-muted">{financeEventDate(t)} · {t.type}{isPlannedFinanceTransaction(t,activeDate)?" · scheduled":t.paid?` · paid${t.paidDate?` ${t.paidDate}`:""}`:""}</p></div><div className="le-inline"><strong>{money(t.amount)}</strong>{t.type!=="Income"&&(t.plannedDate||t.dueDate)&&<button type="button" className="le-text-action" aria-pressed={Boolean(t.paid)} onClick={()=>togglePaid(t,!t.paid)}>{t.paid?"Paid off":"Mark paid"}</button>}<RecordActions name={t.title} edit={()=>editTransaction(t)} remove={()=>deleteTransaction(t.id)}/></div></div>)}{!outgoings.some(t=>t.category===selected)&&<Empty title="No spending recorded in this category." action="Add spending" onClick={()=>addSpending(selected)}/>}</Card></div>}
  </>;
}
