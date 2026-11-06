"use client";

import { useState } from "react";
import { Activity, Dumbbell } from "lucide-react";
import type { LifeData } from "@/lib/life-store";
import { kgToDisplay, planOccurrence } from "@/lib/fitness-domain";

const label = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export function FitnessInsights({ data, month }: { data: LifeData; month: string }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const first = new Date(`${month}-01T12:00:00`);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const dates = Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const offset = (first.getDay() + 6) % 7;
  const logs = data.workoutLogs.filter(log => log.date.startsWith(month));
  const completedDates = new Set(logs.map(log => log.date));
  const plannedDates = dates.filter(date => {
    const explicit = data.scheduledWorkouts.find(item => item.date === date);
    if (explicit) return !explicit.rest;
    return data.fitnessPlans.some(plan => { const day = planOccurrence(plan, date); return day && !day.rest && Boolean(day.workoutId); });
  });
  const records = new Map<string, { weight: number; reps: number; volume: number }>();
  for (const log of logs) for (const set of log.sets || []) {
    if (!set.completedAt) continue;
    const previous = records.get(set.exerciseName);
    const volume = set.weightKg * set.reps;
    if (!previous || set.weightKg > previous.weight || set.weightKg === previous.weight && set.reps > previous.reps) records.set(set.exerciseName, { weight: set.weightKg, reps: set.reps, volume });
  }
  const strongest = [...records.entries()].sort((a, b) => b[1].weight - a[1].weight).slice(0, 4);
  const selected = selectedDate && selectedDate.startsWith(month) ? selectedDate : null;
  const selectedLogs = selected ? logs.filter(log => log.date === selected) : [];
  return <div className="fh-dashboard-grid fh-insights">
    <section className="fh-card"><div className="fh-card-head"><h2>Training rhythm</h2><Activity size={20}/></div><p className="fh-muted">{logs.length} logged {logs.length === 1 ? "workout" : "workouts"} · {plannedDates.length} planned {plannedDates.length === 1 ? "day" : "days"} in {first.toLocaleDateString(undefined, { month: "long" })}</p><div className="fh-heatmap" role="group" aria-label="Workout calendar for selected month">{["M","T","W","T","F","S","S"].map((day, index) => <span key={index} className="fh-heatmap-label">{day}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`}/>)}{dates.map(date => <button type="button" key={date} title={label(date)} aria-label={`${label(date)}: ${completedDates.has(date) ? "workout logged" : plannedDates.includes(date) ? "workout planned" : "no workout"}`} aria-pressed={selected === date} data-state={completedDates.has(date) ? "logged" : plannedDates.includes(date) ? "planned" : "open"} onClick={() => setSelectedDate(date)}>{Number(date.slice(-2))}</button>)}</div><p className="fh-heatmap-detail" role="status">{selected ? <>{label(selected)} · {selectedLogs.length ? selectedLogs.map(log => log.name).join(", ") : plannedDates.includes(selected) ? "A workout is planned" : "No workout logged or planned"}</> : "Select a day to revisit its training."}</p></section>
    <section className="fh-card"><div className="fh-card-head"><h2>Strength notes</h2><Dumbbell size={20}/></div><p className="fh-muted">Your heaviest completed sets this month, from actual session logs.</p>{strongest.length ? <div className="fh-strength-list">{strongest.map(([name, best]) => <div key={name}><strong>{name}</strong><span>{new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(kgToDisplay(best.weight, data.fitnessSettings.weightUnit))} {data.fitnessSettings.weightUnit} × {best.reps} reps</span></div>)}</div> : <div className="fh-empty"><Dumbbell size={25}/><h3>Strength builds in its own time.</h3><p>Completed sets with recorded weight will appear here.</p></div>}</section>
  </div>;
}
