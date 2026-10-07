"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Flame, ImagePlus, Pencil, Plus, RotateCcw, ShieldCheck, Sparkles, Target, Trash2, X } from "lucide-react";
import { MediaImage, MultiImageUpload } from "@/components/workspace-media";
import { useLife, uid, today, type LifeData, type LifeResetProgram, type ResetAccountability, type ResetActivity, type ResetCommitment, type ResetCommitmentType, type ResetIntensity, type ResetLinkedFeature, type ResetStatus } from "@/lib/life-store";

const dayMs = 86_400_000;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ResetTemplate = {
  id: string; name: string; duration: number; intensity: ResetIntensity; accountability: ResetAccountability;
  purpose: string; recommendation: string; pillars: string[]; mood: string; commitments: Omit<ResetCommitment, "id">[];
};

const resetTemplates: ResetTemplate[] = [
  { id: "75-hard", name: "75 Hard", duration: 75, intensity: "Intense", accountability: "Strict", purpose: "A demanding discipline reset built around consistency, training, nutrition, reading, hydration, and daily proof.", recommendation: "Best with a visible accountability partner and a clear restart rule.", pillars: ["Physical", "Mental & Emotional", "Personal Growth"], mood: "discipline", commitments: [
    { title: "Complete two workouts", type: "daily", required: true, pillar: "Physical", linkedFeature: "Fitness", sourceHint: "workout", description: "Log both sessions before the day closes." },
    { title: "Follow your chosen nutrition rules", type: "daily", required: true, pillar: "Physical" },
    { title: "Drink your water target", type: "daily", required: true, pillar: "Physical" },
    { title: "Read 10 pages", type: "daily", required: true, pillar: "Personal Growth", linkedFeature: "Habits", sourceHint: "read" },
    { title: "Take a progress photo", type: "photo", required: true, pillar: "Physical", everyNDays: 1 }
  ] },
  { id: "75-medium", name: "75 Medium", duration: 75, intensity: "Balanced", accountability: "Flexible", purpose: "A structured but humane reset for movement, food choices, reflection, and momentum.", recommendation: "Use flexible restores for real life without hiding missed windows.", pillars: ["Physical", "Mental & Emotional", "Personal Growth"], mood: "momentum", commitments: [
    { title: "Move for 45 minutes", type: "daily", required: true, pillar: "Physical", linkedFeature: "Fitness", sourceHint: "workout" },
    { title: "Keep your nutrition baseline", type: "daily", required: true, pillar: "Physical" },
    { title: "Read or learn for 20 minutes", type: "daily", required: true, pillar: "Personal Growth", linkedFeature: "Habits", sourceHint: "read" },
    { title: "Weekly reflection", type: "weekly-recurring", required: true, pillar: "Mental & Emotional", scheduleDays: [0], linkedFeature: "Journal" },
    { title: "Progress photo every 10 days", type: "photo", required: false, pillar: "Physical", everyNDays: 10 }
  ] },
  { id: "75-soft", name: "75 Soft", duration: 75, intensity: "Gentle", accountability: "Accountability", purpose: "A sustainable reset for wellness basics without an all-or-nothing tone.", recommendation: "Track honestly and let the final statistics tell the real story.", pillars: ["Physical", "Mental & Emotional"], mood: "steady", commitments: [
    { title: "Move your body", type: "daily", required: true, pillar: "Physical", linkedFeature: "Fitness" },
    { title: "Eat with intention", type: "daily", required: true, pillar: "Physical" },
    { title: "Drink water", type: "daily", required: true, pillar: "Physical" },
    { title: "Read 10 pages", type: "daily", required: false, pillar: "Personal Growth", linkedFeature: "Habits" },
    { title: "No alcohol except planned occasions", type: "avoidance", required: true, pillar: "Mental & Emotional" }
  ] },
  { id: "project-50", name: "Project 50", duration: 50, intensity: "Balanced", accountability: "Flexible", purpose: "A focused 50-day season for routine, learning, movement, and fewer distractions.", recommendation: "A weekly check-in works well because several commitments can be weekly.", pillars: ["Physical", "Mental & Emotional", "Personal Growth"], mood: "focus", commitments: [
    { title: "Morning routine before scrolling", type: "daily", required: true, pillar: "Mental & Emotional", linkedFeature: "Habits" },
    { title: "Gym or intentional movement", type: "weekly-quantity", targetPerWeek: 4, required: true, pillar: "Physical", linkedFeature: "Fitness", sourceHint: "gym" },
    { title: "Learn for one hour", type: "daily", required: true, pillar: "Personal Growth", linkedFeature: "Focus" },
    { title: "Dedicated Sunday reset", type: "weekly-recurring", scheduleDays: [0], required: true, pillar: "Personal Growth", linkedFeature: "Planner" },
    { title: "Social media maximum 60 minutes", type: "limit", limitAmount: 60, limitUnit: "minutes", required: true, pillar: "Mental & Emotional" }
  ] },
  { id: "digital-reset", name: "Digital Reset", duration: 21, intensity: "Balanced", accountability: "Flexible", purpose: "A reset for attention, sleep, and screen boundaries.", recommendation: "Use limits and avoidance rules rather than vague intentions.", pillars: ["Mental & Emotional", "Personal Growth"], mood: "clarity", commitments: [
    { title: "Social media maximum 45 minutes", type: "limit", limitAmount: 45, limitUnit: "minutes", required: true, pillar: "Mental & Emotional" },
    { title: "No phone for the first waking hour", type: "avoidance", required: true, pillar: "Mental & Emotional" },
    { title: "Read or journal before bed", type: "daily", required: true, pillar: "Personal Growth", linkedFeature: "Journal" },
    { title: "Screen-free Sunday reflection", type: "weekly-recurring", scheduleDays: [0], required: false, pillar: "Spiritual" }
  ] },
  { id: "wellness-reset", name: "Wellness Reset", duration: 30, intensity: "Gentle", accountability: "Accountability", purpose: "A nourishing reset for sleep, movement, hydration, and emotional steadiness.", recommendation: "Track progress without turning care into pressure.", pillars: ["Physical", "Mental & Emotional", "Spiritual"], mood: "renewal", commitments: [
    { title: "Seven-hour sleep opportunity", type: "daily", required: true, pillar: "Physical" },
    { title: "Move three times per week", type: "weekly-quantity", targetPerWeek: 3, required: true, pillar: "Physical", linkedFeature: "Fitness" },
    { title: "Evening reflection", type: "specific-days", scheduleDays: [1, 3, 5], required: true, pillar: "Mental & Emotional", linkedFeature: "Journal" },
    { title: "One restorative activity", type: "weekly-recurring", scheduleDays: [6], required: false, pillar: "Mental & Emotional" }
  ] },
  { id: "healing-reset", name: "Healing Reset", duration: 30, intensity: "Gentle", accountability: "Accountability", purpose: "A private recovery reset for rebuilding emotional safety and self-trust.", recommendation: "Use private wording for share cards and avoid public details by default.", pillars: ["Mental & Emotional", "Social", "Spiritual"], mood: "healing", commitments: [
    { title: "No contact boundary", type: "avoidance", required: true, pillar: "Mental & Emotional" },
    { title: "Daily grounding practice", type: "daily", required: true, pillar: "Mental & Emotional" },
    { title: "Journal what I need", type: "specific-days", scheduleDays: [2, 4, 0], required: true, pillar: "Mental & Emotional", linkedFeature: "Journal" },
    { title: "Reach out to safe support", type: "weekly-recurring", scheduleDays: [6], required: false, pillar: "Social" }
  ] },
  { id: "bible-30", name: "30-Day Bible Reading Reset", duration: 30, intensity: "Gentle", accountability: "Flexible", purpose: "A spiritual reset built around daily reading, reflection, and prayer.", recommendation: "Flexible mode keeps the programme honest without making one difficult day define the whole season.", pillars: ["Spiritual", "Mental & Emotional"], mood: "spiritual", commitments: [
    { title: "Read the daily passage", type: "daily", required: true, pillar: "Spiritual", linkedFeature: "Spiritual" },
    { title: "Write one reflection", type: "daily", required: true, pillar: "Spiritual", linkedFeature: "Journal" },
    { title: "Prayer and quiet", type: "daily", required: true, pillar: "Spiritual", linkedFeature: "Spiritual" },
    { title: "Sunday review", type: "weekly-recurring", scheduleDays: [0], required: false, pillar: "Spiritual" }
  ] }
];

function Button({ children, onClick, type = "button", secondary = false, disabled = false, className = "" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; secondary?: boolean; disabled?: boolean; className?: string }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`le-button ${secondary ? "le-secondary" : ""} ${className}`.trim()}>{children}</button>;
}
function IconButton({ title, children, onClick, disabled = false }: { title: string; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} className="le-icon" title={title} aria-label={title} onClick={onClick}>{children}</button>;
}
function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section className={`le-card ${className}`.trim()} style={style}>{children}</section>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="le-field"><label>{label}</label>{children}</div>;
}
function Progress({ value }: { value: number }) {
  const safe = Math.min(100, Math.max(0, value));
  return <div className="le-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><span style={{ width: `${safe}%` }} /></div>;
}
function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <div className="lr-modal-shell" role="dialog" aria-modal="true" aria-label={title}><button type="button" className="lr-modal-scrim" aria-label="Close" onClick={close} /><section className="lr-modal"><div className="le-modal-header"><h2>{title}</h2><IconButton title="Close dialog" onClick={close}><X size={20} /></IconButton></div>{children}</section></div>;
}

function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseDate(value: string) { return new Date(`${value}T12:00:00`); }
function addDays(value: string, amount: number) { const date = parseDate(value); date.setDate(date.getDate() + amount); return isoDate(date); }
function daysBetween(start: string, end: string) { return Math.floor((parseDate(end).getTime() - parseDate(start).getTime()) / dayMs); }
function inclusiveDays(start: string, end: string) { return Math.max(0, daysBetween(start, end) + 1); }
function formatDate(value: string) { return parseDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function allowanceFor(duration: number) { return Math.max(1, Math.round(duration / 21)); }
function endDate(start: string, duration: number) { return addDays(start, Math.max(1, duration) - 1); }
function statusFor(reset: LifeResetProgram, date = today()): ResetStatus {
  if (["completed", "failed", "abandoned", "draft"].includes(reset.status)) return reset.status;
  if (date < reset.startDate) return "scheduled";
  if (date > reset.endDate) return reset.status === "scheduled" ? "active" : reset.status;
  return "active";
}
function dayOfReset(reset: LifeResetProgram, date = today()) {
  if (date < reset.startDate) return 0;
  return Math.min(reset.duration, Math.max(1, inclusiveDays(reset.startDate, date)));
}
function progressFor(reset: LifeResetProgram, date = today()) {
  if (reset.status === "completed") return 100;
  if (date < reset.startDate) return 0;
  return Math.min(100, Math.round(dayOfReset(reset, date) / reset.duration * 100));
}
function weekStart(value: string) { const d = parseDate(value); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoDate(d); }
function weekEnd(value: string) { return addDays(weekStart(value), 6); }
function windowKey(commitment: ResetCommitment, start: string, end = start) { return `${commitment.id}:${start}:${end}`; }
function commitmentSummary(commitment: ResetCommitment) {
  if (commitment.type === "daily") return "Every day";
  if (commitment.type === "specific-days") return `On ${commitment.scheduleDays?.map(day => dayNames[day]).join(", ") || "selected days"}`;
  if (commitment.type === "weekly-quantity") return `${commitment.targetPerWeek ?? 1}x per week`;
  if (commitment.type === "weekly-recurring") return `Weekly${commitment.scheduleDays?.length ? ` on ${commitment.scheduleDays.map(day => dayNames[day]).join(", ")}` : ""}`;
  if (commitment.type === "avoidance") return "Avoidance commitment";
  if (commitment.type === "limit") return `Limit ${commitment.limitAmount ?? ""} ${commitment.limitUnit ?? ""}`.trim();
  return commitment.everyNDays ? `Every ${commitment.everyNDays} days` : "Progress photo";
}
function dueOnDay(reset: LifeResetProgram, commitment: ResetCommitment, date: string) {
  const day = parseDate(date).getDay();
  const resetDay = dayOfReset(reset, date);
  if (date < reset.startDate || date > reset.endDate) return false;
  if (commitment.type === "daily" || commitment.type === "avoidance" || commitment.type === "limit") return true;
  if (commitment.type === "specific-days") return Boolean(commitment.scheduleDays?.includes(day));
  if (commitment.type === "weekly-recurring") return Boolean(commitment.scheduleDays?.includes(day) ?? day === 0);
  if (commitment.type === "weekly-quantity") return true;
  if (commitment.type === "photo") return resetDay === 1 || resetDay === reset.duration || Boolean(commitment.everyNDays && resetDay % commitment.everyNDays === 0);
  return false;
}
function resetDateRange(reset: LifeResetProgram, through = today()) {
  const end = through < reset.endDate ? through : reset.endDate;
  const count = inclusiveDays(reset.startDate, end);
  return Array.from({ length: count }, (_, index) => addDays(reset.startDate, index));
}
function syncedActivities(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment): ResetActivity[] {
  const start = reset.startDate, end = reset.endDate;
  const inRange = (date: string) => date >= start && date <= end;
  if (commitment.linkedFeature === "Fitness") {
    return data.workoutLogs.filter(log => inRange(log.date)).map(log => ({ id: `fitness-${log.id}`, commitmentId: commitment.id, date: log.date, source: "fitness", externalId: log.id, note: log.name }));
  }
  if (commitment.linkedFeature === "Habits") {
    const hint = (commitment.sourceHint || commitment.title).toLowerCase();
    return data.habits.filter(habit => habit.direction === "build" && (habit.name.toLowerCase().includes(hint) || hint.includes(habit.name.toLowerCase()))).flatMap(habit => habit.dates.filter(inRange).map(date => ({ id: `habit-${habit.id}-${date}`, commitmentId: commitment.id, date, source: "habit" as const, externalId: habit.id, note: habit.name })));
  }
  if (commitment.linkedFeature === "Journal") {
    return data.journals.filter(journal => inRange(journal.date)).map(journal => ({ id: `journal-${journal.id}`, commitmentId: commitment.id, date: journal.date, source: "journal", externalId: journal.id, note: journal.title }));
  }
  if (commitment.linkedFeature === "Spiritual") {
    return [...data.prayers.filter(row => inRange(row.date)).map(row => ({ id: `prayer-${row.id}`, commitmentId: commitment.id, date: row.date, source: "spiritual" as const, externalId: row.id, note: row.title })), ...data.studyPlans.filter(row => inRange(row.date)).map(row => ({ id: `study-${row.id}`, commitmentId: commitment.id, date: row.date, source: "spiritual" as const, externalId: row.id, note: row.title }))];
  }
  if (commitment.linkedFeature === "Planner") {
    return data.tasks.filter(task => task.done && inRange(task.date) && task.title.toLowerCase().includes(commitment.title.split(" ")[0].toLowerCase())).map(task => ({ id: `planner-${task.id}`, commitmentId: commitment.id, date: task.date, source: "planner", externalId: task.id, note: task.title }));
  }
  if (commitment.linkedFeature === "Focus") {
    return data.focus.filter(row => inRange(row.date)).map(row => ({ id: `focus-${row.id}`, commitmentId: commitment.id, date: row.date, source: "focus", externalId: row.id, note: row.name, value: row.seconds }));
  }
  return [];
}
function allActivities(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment) {
  const manual = reset.activities.filter(activity => activity.commitmentId === commitment.id);
  const synced = syncedActivities(data, reset, commitment);
  const unique = new Map<string, ResetActivity>();
  [...manual, ...synced].forEach(activity => unique.set(`${activity.source}:${activity.externalId ?? activity.id}:${activity.date}`, activity));
  return [...unique.values()];
}
function activityCountInWindow(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment, start: string, end = start) {
  if (commitment.type === "photo") return reset.photos.filter(photo => photo.date >= start && photo.date <= end).length;
  const dates = new Set(allActivities(data, reset, commitment).filter(activity => activity.date >= start && activity.date <= end).map(activity => activity.date));
  return dates.size;
}
function commitmentComplete(data: LifeData, reset: LifeResetProgram, commitment: ResetCommitment, date: string) {
  if (commitment.type === "weekly-quantity") {
    const start = weekStart(date), end = weekEnd(date);
    return activityCountInWindow(data, reset, commitment, start < reset.startDate ? reset.startDate : start, end > reset.endDate ? reset.endDate : end) >= (commitment.targetPerWeek ?? 1);
  }
  if (commitment.type === "weekly-recurring") {
    const start = weekStart(date), end = weekEnd(date);
    return activityCountInWindow(data, reset, commitment, start < reset.startDate ? reset.startDate : start, end > reset.endDate ? reset.endDate : end) >= 1;
  }
  return activityCountInWindow(data, reset, commitment, date) > 0;
}
function missedWindows(data: LifeData, reset: LifeResetProgram, asOf = today()) {
  const yesterday = addDays(asOf, -1);
  if (yesterday < reset.startDate) return [];
  const misses: { commitment: ResetCommitment; start: string; end: string; label: string; key: string }[] = [];
  for (const commitment of reset.commitments.filter(item => item.required)) {
    if (commitment.type === "weekly-quantity" || commitment.type === "weekly-recurring") {
      const weeks = new Set(resetDateRange(reset, yesterday).map(date => weekStart(date)));
      weeks.forEach(start => {
        const end = weekEnd(start);
        if (end >= asOf) return;
        const windowStart = start < reset.startDate ? reset.startDate : start;
        const windowEnd = end > reset.endDate ? reset.endDate : end;
        if (!commitmentComplete(data, reset, commitment, windowEnd)) misses.push({ commitment, start: windowStart, end: windowEnd, label: `${formatDate(windowStart)} to ${formatDate(windowEnd)}`, key: windowKey(commitment, windowStart, windowEnd) });
      });
      continue;
    }
    resetDateRange(reset, yesterday).forEach(date => {
      if (dueOnDay(reset, commitment, date) && !commitmentComplete(data, reset, commitment, date)) misses.push({ commitment, start: date, end: date, label: formatDate(date), key: windowKey(commitment, date) });
    });
  }
  return misses;
}
function resetStats(data: LifeData, reset: LifeResetProgram) {
  const progress = progressFor(reset);
  const misses = missedWindows(data, reset);
  const restored = new Set(reset.restores.map(restore => restore.window));
  const unresolved = misses.filter(miss => !restored.has(miss.key));
  const completions = reset.commitments.reduce((sum, commitment) => sum + allActivities(data, reset, commitment).length, 0) + reset.photos.length;
  const requiredWindows = reset.commitments.filter(item => item.required).reduce((sum, commitment) => sum + resetDateRange(reset).filter(date => dueOnDay(reset, commitment, date)).length, 0);
  const missedCount = misses.length;
  const adherence = requiredWindows ? Math.max(0, Math.round((requiredWindows - missedCount) / requiredWindows * 100)) : progress;
  const strictBroken = reset.accountability === "Strict" && unresolved.length > 0;
  const flexibleBroken = reset.accountability === "Flexible" && unresolved.length > Math.max(0, reset.restoreAllowance - reset.restores.length);
  return { progress, day: dayOfReset(reset), misses, unresolved, completions, adherence, strictBroken, flexibleBroken, restoresRemaining: Math.max(0, reset.restoreAllowance - reset.restores.length), editsRemaining: Math.max(0, reset.editAllowance - reset.changes.length) };
}
function makeCommitment(seed: Omit<ResetCommitment, "id">, pillars: string[]): ResetCommitment {
  const pillar = pillars.includes(seed.pillar) ? seed.pillar : pillars[0] ?? "Personal Growth";
  return { ...seed, id: uid(), pillar };
}
function makeResetFromTemplate(template: ResetTemplate | null, pillars: string[]): LifeResetProgram {
  const startDate = today();
  const duration = template?.duration ?? 21;
  const name = template?.name ?? "My Life Reset";
  const accountability = template?.accountability ?? "Flexible";
  return {
    id: uid(), templateId: template?.id, name, publicName: template?.id === "healing-reset" ? "30 days of choosing myself" : name,
    why: template?.purpose ?? "", outcome: "", startDate, endDate: endDate(startDate, duration), duration,
    pillars: (template?.pillars ?? ["Personal Growth"]).filter(pillar => pillars.includes(pillar)).slice(0, 4),
    status: "active", accountability, intensity: template?.intensity ?? "Balanced",
    restoreAllowance: accountability === "Flexible" ? allowanceFor(duration) : 0, editAllowance: allowanceFor(duration),
    commitments: (template?.commitments ?? [{ title: "Keep one daily promise", type: "daily", required: true, pillar: pillars.includes("Personal Growth") ? "Personal Growth" : pillars[0] ?? "Personal Growth" }]).map(item => makeCommitment(item, pillars)),
    activities: [], photos: [], changes: [], restores: [],
    share: { publicTitle: template?.id === "healing-reset" ? "30 days of choosing myself" : name, showName: true, showDates: true, showStats: true, showMisses: false, showPhotos: false, showReflection: true, statement: "" },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
}

export function LifeResetWorkspace() {
  const { data, update } = useLife();
  const allPillars = data.lifePillars?.length ? data.lifePillars : ["Financial", "Physical", "Mental & Emotional", "Social", "Spiritual", "Personal Growth"];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creator, setCreator] = useState<LifeResetProgram | null>(null);
  const [templateFilter, setTemplateFilter] = useState("All");
  const [editingCommitment, setEditingCommitment] = useState<{ reset: LifeResetProgram; commitment: ResetCommitment } | null>(null);
  const [shareReset, setShareReset] = useState<LifeResetProgram | null>(null);
  const [celebration, setCelebration] = useState("");
  const selected = data.lifeResets.find(reset => reset.id === selectedId) ?? null;
  const active = data.lifeResets.filter(reset => statusFor(reset) === "active" && reset.status !== "completed").sort((a, b) => a.startDate.localeCompare(b.startDate));
  const scheduled = data.lifeResets.filter(reset => statusFor(reset) === "scheduled").sort((a, b) => a.startDate.localeCompare(b.startDate));
  const completed = data.lifeResets.filter(reset => reset.status === "completed").sort((a, b) => (b.completedAt ?? b.endDate).localeCompare(a.completedAt ?? a.endDate));
  const filteredTemplates = resetTemplates.filter(template => templateFilter === "All" || template.intensity === templateFilter);

  function saveReset(reset: LifeResetProgram) {
    update(d => ({ ...d, lifeResets: [...d.lifeResets.filter(item => item.id !== reset.id), { ...reset, updatedAt: new Date().toISOString() }] }));
  }
  function patchReset(id: string, patcher: (reset: LifeResetProgram) => LifeResetProgram) {
    update(d => ({ ...d, lifeResets: d.lifeResets.map(reset => reset.id === id ? { ...patcher(reset), updatedAt: new Date().toISOString() } : reset) }));
  }
  function openCreator(template: ResetTemplate | null) { setCreator(makeResetFromTemplate(template, allPillars)); }
  function togglePillar(pillar: string) {
    if (!creator) return;
    const pillars = creator.pillars.includes(pillar) ? creator.pillars.filter(item => item !== pillar) : [...creator.pillars, pillar];
    setCreator({ ...creator, pillars: pillars.length ? pillars : [pillar] });
  }
  function setDuration(duration: number) {
    if (!creator) return;
    const safe = Math.max(1, Math.min(365, duration || 1));
    setCreator({ ...creator, duration: safe, endDate: endDate(creator.startDate, safe), restoreAllowance: creator.accountability === "Flexible" ? allowanceFor(safe) : 0, editAllowance: allowanceFor(safe) });
  }
  function setStartDate(startDate: string) {
    if (!creator) return;
    setCreator({ ...creator, startDate, endDate: endDate(startDate, creator.duration) });
  }
  function setAccountability(accountability: ResetAccountability) {
    if (!creator) return;
    setCreator({ ...creator, accountability, restoreAllowance: accountability === "Flexible" ? allowanceFor(creator.duration) : 0 });
  }
  function addCommitment() {
    if (!creator) return;
    setCreator({ ...creator, commitments: [...creator.commitments, { id: uid(), title: "New commitment", type: "daily", required: true, pillar: creator.pillars[0] ?? allPillars[0] }] });
  }
  function updateCreatorCommitment(id: string, patch: Partial<ResetCommitment>) {
    if (!creator) return;
    setCreator({ ...creator, commitments: creator.commitments.map(item => item.id === id ? { ...item, ...patch } : item) });
  }
  function saveCreator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creator) return;
    const form = new FormData(event.currentTarget);
    const mode = String(form.get("activation"));
    const status: ResetStatus = mode === "prepare" ? "draft" : creator.startDate > today() ? "scheduled" : "active";
    const reset = { ...creator, name: creator.name.trim(), why: creator.why.trim(), outcome: creator.outcome.trim(), status, publicName: creator.publicName || creator.name, endDate: endDate(creator.startDate, creator.duration) };
    saveReset(reset);
    setCreator(null);
    setSelectedId(reset.id);
  }
  function toggleActivity(reset: LifeResetProgram, commitment: ResetCommitment, date: string) {
    const manualKey = `reset:${commitment.id}:${date}`;
    const existing = reset.activities.find(activity => activity.source === "reset" && activity.commitmentId === commitment.id && activity.date === date);
    update(d => {
      const resets = d.lifeResets.map(item => {
        if (item.id !== reset.id) return item;
        const nextActivities = existing ? item.activities.filter(activity => !(activity.source === "reset" && activity.commitmentId === commitment.id && activity.date === date)) : [...item.activities, { id: uid(), commitmentId: commitment.id, date, source: "reset" as const, externalId: manualKey }];
        return { ...item, activities: nextActivities, updatedAt: new Date().toISOString() };
      });
      const next: LifeData = { ...d, lifeResets: resets };
      if (!existing && commitment.linkedFeature === "Fitness" && !d.workoutLogs.some(log => log.id === manualKey)) {
        next.workoutLogs = [...d.workoutLogs, { id: manualKey, name: commitment.title, date, minutes: 30, volume: 0, notes: `Logged from Life Reset: ${reset.name}` }];
      }
      if (existing && commitment.linkedFeature === "Fitness") next.workoutLogs = d.workoutLogs.filter(log => log.id !== manualKey);
      if (!existing && commitment.linkedFeature === "Habits") {
        const found = d.habits.find(habit => habit.direction === "build" && habit.name.toLowerCase() === commitment.title.toLowerCase());
        next.habits = found ? d.habits.map(habit => habit.id === found.id ? { ...habit, dates: habit.dates.includes(date) ? habit.dates : [...habit.dates, date] } : habit) : [...d.habits, { id: uid(), name: commitment.title, direction: "build", dates: [date], start: reset.startDate, setbacks: [] }];
      }
      return next;
    });
  }
  function completeDay(reset: LifeResetProgram) {
    const due = reset.commitments.filter(commitment => commitment.required && dueOnDay(reset, commitment, today()));
    const remaining = due.filter(commitment => !commitmentComplete(data, reset, commitment, today()));
    if (remaining.length) return;
    setCelebration(`${reset.name}: day ${dayOfReset(reset)} complete.`);
    window.setTimeout(() => setCelebration(""), 2600);
  }
  function useRestore(reset: LifeResetProgram) {
    const stats = resetStats(data, reset);
    const miss = stats.unresolved[0];
    if (!miss || stats.restoresRemaining <= 0) return;
    patchReset(reset.id, current => ({ ...current, restores: [...current.restores, { id: uid(), date: today(), window: miss.key, note: `${miss.commitment.title} restored for ${miss.label}` }], changes: [...current.changes, { id: uid(), date: today(), day: dayOfReset(current), text: `Restore used for ${miss.commitment.title} (${miss.label}).` }] }));
  }
  function restartReset(reset: LifeResetProgram) {
    const startDate = today();
    patchReset(reset.id, current => ({ ...current, startDate, endDate: endDate(startDate, current.duration), status: "active", activities: [], photos: [], restores: [], completedAt: undefined, changes: [...current.changes, { id: uid(), date: today(), day: 1, text: "Programme restarted from Day 1." }] }));
  }
  function completeReset(reset: LifeResetProgram, reflection = "") {
    patchReset(reset.id, current => ({ ...current, status: "completed", completedAt: new Date().toISOString(), completionReflection: reflection || current.completionReflection, changes: [...current.changes, { id: uid(), date: today(), day: dayOfReset(current), text: "Reset completed." }] }));
    setShareReset({ ...reset, status: "completed" });
  }
  function updatePhotos(reset: LifeResetProgram, sources: string[]) {
    patchReset(reset.id, current => {
      const nextPhotos = sources.map((source, index) => current.photos.find(photo => photo.source === source) ?? { id: uid(), source, date: today(), label: index === 0 ? "Starting photo" : `Progress photo ${index + 1}` });
      return { ...current, photos: nextPhotos };
    });
  }
  function saveCommitmentEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCommitment) return;
    const { reset, commitment } = editingCommitment;
    const stats = resetStats(data, reset);
    if (statusFor(reset) === "active" && stats.editsRemaining <= 0) return;
    const form = new FormData(event.currentTarget);
    const next: ResetCommitment = {
      ...commitment,
      title: String(form.get("title")).trim(),
      type: String(form.get("type")) as ResetCommitmentType,
      pillar: String(form.get("pillar")),
      required: form.get("required") === "on",
      targetPerWeek: Number(form.get("targetPerWeek")) || undefined,
      everyNDays: Number(form.get("everyNDays")) || undefined,
      limitAmount: Number(form.get("limitAmount")) || undefined,
      limitUnit: String(form.get("limitUnit") || ""),
      linkedFeature: String(form.get("linkedFeature") || "") as ResetLinkedFeature || undefined,
      scheduleDays: Array.from(form.getAll("scheduleDays")).map(Number)
    };
    const changes = [commitment.title !== next.title && `"${commitment.title}" renamed to "${next.title}"`, commitment.type !== next.type && `${commitment.title} changed from ${commitmentSummary(commitment)} to ${commitmentSummary(next)}`, commitment.required !== next.required && `${next.title} marked ${next.required ? "required" : "optional"}`].filter(Boolean).join(". ");
    patchReset(reset.id, current => ({ ...current, commitments: current.commitments.map(item => item.id === commitment.id ? next : item), changes: [...current.changes, { id: uid(), date: today(), day: dayOfReset(current), text: changes || `${next.title} adjusted.` }] }));
    setEditingCommitment(null);
  }

  if (selected) return <ResetDetail data={data} reset={selected} allPillars={allPillars} back={() => setSelectedId(null)} toggleActivity={toggleActivity} completeDay={completeDay} useRestore={useRestore} restartReset={restartReset} completeReset={completeReset} updatePhotos={updatePhotos} editCommitment={(reset, commitment) => setEditingCommitment({ reset, commitment })} openShare={setShareReset} celebration={celebration} />;

  return <section className="lr-space">
    <div className="lr-hero">
      <div>
        <p className="le-eyebrow">Life Reset</p>
        <h1>Enter a defined season of change.</h1>
        <p>Structured reset programmes bring your habits, goals, fitness, reflection, spiritual routines, and boundaries into one temporary commitment with a beginning, rules, progress, and a meaningful finish.</p>
        <div className="le-inline"><Button onClick={() => openCreator(null)}><Plus size={16} />Create your own</Button><a className="le-button le-secondary" href="#reset-library"><Sparkles size={16} />Browse library</a><Link href={"/dashboard" as Route} className="le-button le-secondary"><ArrowLeft size={16} />Normal Life Edit</Link></div>
      </div>
      <div className="lr-flame-stage" aria-hidden="true"><Flame size={96} /><span /><span /></div>
    </div>

    {active.length > 0 ? <section className="lr-section"><div className="le-row"><div><p className="le-eyebrow">Active resets</p><h2>Your current programmes</h2></div><Button secondary onClick={() => openCreator(null)}><Plus size={16} />New Reset</Button></div><div className="lr-active-grid">{active.map(reset => <ResetCard key={reset.id} data={data} reset={reset} onOpen={() => setSelectedId(reset.id)} />)}</div></section> : <section className="lr-empty-state"><div><p className="le-eyebrow">No active reset</p><h2>Start with a programme, or write your own rules.</h2><p>Life Reset stays quiet until you intentionally enter it. Browse curated structures, personalise the commitments, and choose when the season begins.</p></div><Button onClick={() => openCreator(null)}><Plus size={16} />Create Your Own</Button></section>}

    {scheduled.length > 0 && <section className="lr-section"><p className="le-eyebrow">Upcoming</p><div className="lr-upcoming-strip">{scheduled.map(reset => <button key={reset.id} onClick={() => setSelectedId(reset.id)}><CalendarDays size={18} /><span><strong>{reset.name}</strong><small>Starts in {daysBetween(today(), reset.startDate)} days · {formatDate(reset.startDate)}</small></span><ChevronRight size={17} /></button>)}</div></section>}

    <section id="reset-library" className="lr-section">
      <div className="le-row"><div><p className="le-eyebrow">Programme library</p><h2>Curated reset foundations</h2></div><div className="lr-filter"><button aria-pressed={templateFilter === "All"} onClick={() => setTemplateFilter("All")}>All</button>{(["Gentle", "Balanced", "Intense"] as const).map(item => <button key={item} aria-pressed={templateFilter === item} onClick={() => setTemplateFilter(item)}>{item}</button>)}</div></div>
      <div className="lr-library-grid">
        <button className="lr-template-card lr-template-custom" onClick={() => openCreator(null)}><span><Plus size={22} /></span><strong>Create Your Own</strong><p>Build a personal reset with daily, weekly, avoidance, limit, and photo commitments.</p><small>Flexible by design</small></button>
        {filteredTemplates.map(template => <button key={template.id} className={`lr-template-card lr-mood-${template.mood}`} onClick={() => openCreator(template)}><span>{template.duration} days</span><strong>{template.name}</strong><p>{template.purpose}</p><small>{template.intensity} · recommends {template.accountability}</small></button>)}
      </div>
    </section>

    {completed.length > 0 && <section className="lr-section"><p className="le-eyebrow">Completed</p><div className="lr-completed-row">{completed.slice(0, 3).map(reset => <button key={reset.id} onClick={() => setSelectedId(reset.id)}><Flame size={18} /><strong>{reset.name}</strong><small>{resetStats(data, reset).adherence}% adherence</small></button>)}</div></section>}

    {creator && <Modal title={creator.templateId ? `Personalise ${creator.name}` : "Create Your Own Reset"} close={() => setCreator(null)}>
      <form onSubmit={saveCreator} className="lr-creator">
        <div className="lr-form-grid">
          <Field label="Reset name"><input required value={creator.name} maxLength={80} onChange={e => setCreator({ ...creator, name: e.target.value, share: { ...creator.share, publicTitle: e.target.value } })} /></Field>
          <Field label="Public share wording"><input value={creator.publicName ?? ""} maxLength={90} onChange={e => setCreator({ ...creator, publicName: e.target.value, share: { ...creator.share, publicTitle: e.target.value } })} placeholder="Optional public version" /></Field>
        </div>
        <Field label="Why are you doing this?"><textarea rows={3} value={creator.why} onChange={e => setCreator({ ...creator, why: e.target.value })} /></Field>
        <Field label="Intended outcome"><textarea rows={2} value={creator.outcome} onChange={e => setCreator({ ...creator, outcome: e.target.value })} /></Field>
        <div className="lr-form-grid">
          <Field label="Start date"><input type="date" required value={creator.startDate} onChange={e => setStartDate(e.target.value)} /></Field>
          <Field label="Duration"><input type="number" min={1} max={365} value={creator.duration} onChange={e => setDuration(Number(e.target.value))} /></Field>
          <Field label="End date"><input readOnly value={creator.endDate} /></Field>
          <Field label="Intensity"><select value={creator.intensity} onChange={e => setCreator({ ...creator, intensity: e.target.value as ResetIntensity })}>{["Gentle", "Balanced", "Intense"].map(item => <option key={item}>{item}</option>)}</select></Field>
        </div>
        <fieldset className="lr-fieldset"><legend>Life Edit pillars</legend><div className="lr-pillars">{allPillars.map(pillar => <button type="button" key={pillar} aria-pressed={creator.pillars.includes(pillar)} onClick={() => togglePillar(pillar)}>{pillar}</button>)}</div></fieldset>
        <fieldset className="lr-fieldset"><legend>Accountability</legend><div className="lr-mode-grid">{(["Strict", "Accountability", "Flexible"] as const).map(mode => <button type="button" key={mode} aria-pressed={creator.accountability === mode} onClick={() => setAccountability(mode)}><strong>{mode}</strong><span>{mode === "Strict" ? "Misses break the run." : mode === "Flexible" ? `${creator.restoreAllowance} restores included.` : "Misses stay visible in final stats."}</span></button>)}</div></fieldset>
        <section className="lr-commitment-editor"><div className="le-row"><div><p className="le-eyebrow">Commitments</p><h2>Make the programme fit your real life.</h2></div><Button secondary onClick={addCommitment}><Plus size={16} />Add commitment</Button></div>{creator.commitments.map(commitment => <CreatorCommitment key={commitment.id} commitment={commitment} pillars={allPillars} update={patch => updateCreatorCommitment(commitment.id, patch)} remove={() => setCreator({ ...creator, commitments: creator.commitments.filter(item => item.id !== commitment.id) })} />)}</section>
        <fieldset className="lr-fieldset"><legend>Activation</legend><label className="le-check-row"><input type="radio" name="activation" value="today" defaultChecked={creator.startDate <= today()} />Start when the start date arrives</label><label className="le-check-row"><input type="radio" name="activation" value="prepare" />Prepare only, do not activate yet</label></fieldset>
        <div className="le-row"><Button type="submit"><Check size={16} />Save Reset</Button><Button secondary onClick={() => setCreator(null)}>Cancel</Button></div>
      </form>
    </Modal>}
    {editingCommitment && <Modal title="Adjust commitment" close={() => setEditingCommitment(null)}><CommitmentEditForm reset={editingCommitment.reset} commitment={editingCommitment.commitment} pillars={allPillars} data={data} save={saveCommitmentEdit} /></Modal>}
    {shareReset && <ShareCardModal reset={data.lifeResets.find(reset => reset.id === shareReset.id) ?? shareReset} data={data} updateReset={patchReset} close={() => setShareReset(null)} />}
  </section>;
}

function ResetCard({ data, reset, onOpen }: { data: LifeData; reset: LifeResetProgram; onOpen: () => void }) {
  const stats = resetStats(data, reset);
  const todayCommitments = reset.commitments.filter(commitment => dueOnDay(reset, commitment, today()));
  return <button className="lr-reset-card" onClick={onOpen}>
    <div className="lr-reset-art"><Flame size={42} /><span style={{ height: `${Math.max(18, stats.progress)}%` }} /></div>
    <div>
      <p className="le-eyebrow">{reset.accountability}{reset.accountability === "Flexible" ? ` · ${stats.restoresRemaining} restores left` : ""}</p>
      <h3>{reset.name}</h3>
      <p>{reset.why || "A defined season of intentional change."}</p>
      <Progress value={stats.progress} />
      <div className="lr-card-stats"><span>Day {stats.day}/{reset.duration}</span><span>{stats.adherence}% adherence</span><span>{todayCommitments.length} due today</span></div>
    </div>
  </button>;
}

function CreatorCommitment({ commitment, pillars, update, remove }: { commitment: ResetCommitment; pillars: string[]; update: (patch: Partial<ResetCommitment>) => void; remove: () => void }) {
  return <div className="lr-commitment-row">
    <input aria-label="Commitment title" value={commitment.title} onChange={e => update({ title: e.target.value })} />
    <select aria-label="Commitment type" value={commitment.type} onChange={e => update({ type: e.target.value as ResetCommitmentType })}>{["daily", "specific-days", "weekly-quantity", "weekly-recurring", "avoidance", "limit", "photo"].map(item => <option key={item} value={item}>{item.replace("-", " ")}</option>)}</select>
    <select aria-label="Pillar" value={commitment.pillar} onChange={e => update({ pillar: e.target.value })}>{pillars.map(pillar => <option key={pillar}>{pillar}</option>)}</select>
    {(commitment.type === "specific-days" || commitment.type === "weekly-recurring") && <div className="lr-day-pills">{dayNames.map((day, index) => <button type="button" key={day} aria-pressed={commitment.scheduleDays?.includes(index) ?? false} onClick={() => update({ scheduleDays: commitment.scheduleDays?.includes(index) ? commitment.scheduleDays.filter(item => item !== index) : [...(commitment.scheduleDays ?? []), index] })}>{day}</button>)}</div>}
    {commitment.type === "weekly-quantity" && <input aria-label="Weekly target" type="number" min={1} max={14} value={commitment.targetPerWeek ?? 1} onChange={e => update({ targetPerWeek: Number(e.target.value) })} />}
    {commitment.type === "photo" && <input aria-label="Photo frequency" type="number" min={1} max={30} value={commitment.everyNDays ?? 10} onChange={e => update({ everyNDays: Number(e.target.value) })} />}
    {commitment.type === "limit" && <input aria-label="Limit amount" type="number" min={1} value={commitment.limitAmount ?? 60} onChange={e => update({ limitAmount: Number(e.target.value), limitUnit: commitment.limitUnit || "minutes" })} />}
    <label className="lr-required"><input type="checkbox" checked={commitment.required} onChange={e => update({ required: e.target.checked })} />Required</label>
    <IconButton title="Remove commitment" onClick={remove}><Trash2 size={16} /></IconButton>
  </div>;
}

function ResetDetail({ data, reset, allPillars, back, toggleActivity, completeDay, useRestore, restartReset, completeReset, updatePhotos, editCommitment, openShare, celebration }: { data: LifeData; reset: LifeResetProgram; allPillars: string[]; back: () => void; toggleActivity: (reset: LifeResetProgram, commitment: ResetCommitment, date: string) => void; completeDay: (reset: LifeResetProgram) => void; useRestore: (reset: LifeResetProgram) => void; restartReset: (reset: LifeResetProgram) => void; completeReset: (reset: LifeResetProgram, reflection?: string) => void; updatePhotos: (reset: LifeResetProgram, sources: string[]) => void; editCommitment: (reset: LifeResetProgram, commitment: ResetCommitment) => void; openShare: (reset: LifeResetProgram) => void; celebration: string }) {
  const stats = resetStats(data, reset);
  const [reflection, setReflection] = useState(reset.completionReflection ?? "");
  const due = reset.commitments.filter(commitment => dueOnDay(reset, commitment, today()));
  const requiredDue = due.filter(commitment => commitment.required);
  const remaining = requiredDue.filter(commitment => !commitmentComplete(data, reset, commitment, today()));
  const canCompleteDay = statusFor(reset) === "active" && requiredDue.length > 0 && remaining.length === 0;
  const canCompleteReset = reset.status !== "completed" && today() >= reset.endDate;
  return <section className="lr-space">
    <button className="lr-back" onClick={back}><ArrowLeft size={16} />Life Reset dashboard</button>
    <div className="lr-detail-hero">
      <div>
        <p className="le-eyebrow">{reset.accountability} reset · {reset.intensity}</p>
        <h1>{reset.name}</h1>
        <p>{reset.why || reset.outcome || "A structured season inside The Life Edit."}</p>
        <div className="lr-pillar-cloud">{reset.pillars.map(pillar => <span key={pillar}>{pillar}</span>)}</div>
      </div>
      <div className="lr-flame-meter" data-stage={Math.ceil(stats.progress / 25)}><Flame size={86} /><strong>{stats.progress}%</strong><small>Day {stats.day}/{reset.duration}</small></div>
    </div>
    {celebration && <div className="lr-celebration" role="status"><Sparkles size={18} />{celebration}</div>}
    <div className="lr-detail-grid">
      <Card className="lr-today-panel">
        <div className="le-row"><div><p className="le-eyebrow">Today</p><h2>Commitments due now</h2></div><Button disabled={!canCompleteDay} onClick={() => completeDay(reset)}><Check size={16} />Complete Day</Button></div>
        {due.length === 0 ? <p className="le-muted">Nothing is due today for this Reset.</p> : due.map(commitment => <CommitmentCheck key={commitment.id} data={data} reset={reset} commitment={commitment} toggle={() => toggleActivity(reset, commitment, today())} />)}
        {remaining.length > 0 && <p className="le-error">Complete required commitments before closing today.</p>}
      </Card>
      <Card className="lr-status-panel">
        <p className="le-eyebrow">Accountability state</p>
        <h2>{stats.strictBroken || stats.flexibleBroken ? "The current run needs attention." : reset.accountability === "Accountability" ? "Progress continues with honest stats." : "Your run is intact."}</h2>
        <div className="lr-stat-grid"><div><strong>{stats.adherence}%</strong><span>Adherence</span></div><div><strong>{stats.misses.length}</strong><span>Missed windows</span></div><div><strong>{stats.restoresRemaining}</strong><span>Restores left</span></div><div><strong>{stats.editsRemaining}</strong><span>Adjustments left</span></div></div>
        {reset.accountability === "Flexible" && stats.unresolved.length > 0 && <Button disabled={stats.restoresRemaining <= 0} onClick={() => useRestore(reset)}><ShieldCheck size={16} />Use restore</Button>}
        {reset.accountability === "Strict" && stats.strictBroken && <Button secondary onClick={() => restartReset(reset)}><RotateCcw size={16} />Restart from Day 1</Button>}
      </Card>
    </div>
    <div className="lr-detail-grid">
      <Card>
        <div className="le-row"><div><p className="le-eyebrow">Programme rules</p><h2>Commitments and windows</h2></div></div>
        <div className="lr-rule-list">{reset.commitments.map(commitment => <div key={commitment.id}><span>{commitment.required ? "Required" : "Optional"}</span><strong>{commitment.title}</strong><small>{commitmentSummary(commitment)} · {commitment.pillar}{commitment.linkedFeature ? ` · syncs with ${commitment.linkedFeature}` : ""}</small><IconButton title={`Adjust ${commitment.title}`} disabled={statusFor(reset) === "active" && stats.editsRemaining <= 0} onClick={() => editCommitment(reset, commitment)}><Pencil size={16} /></IconButton></div>)}</div>
      </Card>
      <Card>
        <p className="le-eyebrow">This week</p><h2>Weekly progress</h2>
        {reset.commitments.filter(item => item.type === "weekly-quantity" || item.type === "weekly-recurring").map(commitment => {
          const count = activityCountInWindow(data, reset, commitment, weekStart(today()), weekEnd(today()));
          const target = commitment.type === "weekly-quantity" ? commitment.targetPerWeek ?? 1 : 1;
          return <div className="lr-week-row" key={commitment.id}><div><strong>{commitment.title}</strong><small>{count}/{target} complete. Window closes {formatDate(weekEnd(today()))}.</small></div><Progress value={Math.min(100, count / target * 100)} /></div>;
        })}
        {reset.commitments.every(item => item.type !== "weekly-quantity" && item.type !== "weekly-recurring") && <p className="le-muted">This Reset does not include weekly requirements.</p>}
      </Card>
    </div>
    <Card>
      <div className="le-row"><div><p className="le-eyebrow">Progress photos</p><h2>Journey gallery</h2></div><ImagePlus size={22} /></div>
      <MultiImageUpload label="Reset photos" values={reset.photos.map(photo => photo.source)} onChange={sources => updatePhotos(reset, sources)} max={12} />
      {reset.photos.length > 0 && <div className="lr-photo-strip">{reset.photos.map(photo => <figure key={photo.id}><MediaImage source={photo.source} alt={photo.label} /><figcaption>{photo.label}<small>{formatDate(photo.date)}</small></figcaption></figure>)}</div>}
    </Card>
    <div className="lr-detail-grid">
      <Card>
        <p className="le-eyebrow">Timeline</p><h2>Transparent changes</h2>
        {reset.changes.length ? reset.changes.slice().reverse().map(change => <p className="lr-log" key={change.id}>Day {change.day}: {change.text}<small>{formatDate(change.date)}</small></p>) : <p className="le-muted">No adjustments have been made.</p>}
      </Card>
      <Card>
        <p className="le-eyebrow">Completion</p><h2>{reset.status === "completed" ? "Reset complete." : "Finish with meaning."}</h2>
        <Field label="Reflection"><textarea rows={4} value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What changed in you during this Reset?" /></Field>
        <div className="le-inline"><Button disabled={!canCompleteReset && reset.status !== "completed"} onClick={() => reset.status === "completed" ? openShare(reset) : completeReset(reset, reflection)}><Flame size={16} />{reset.status === "completed" ? "Keepsake card" : "Complete Reset"}</Button><Link href={"/dashboard" as Route} className="le-button le-secondary"><ArrowRight size={16} />Return to Life Edit</Link></div>
      </Card>
    </div>
  </section>;
}

function CommitmentCheck({ data, reset, commitment, toggle }: { data: LifeData; reset: LifeResetProgram; commitment: ResetCommitment; toggle: () => void }) {
  const complete = commitmentComplete(data, reset, commitment, today());
  const synced = allActivities(data, reset, commitment).some(activity => activity.date === today() && activity.source !== "reset");
  return <label className={`lr-check ${complete ? "is-complete" : ""}`}><input type="checkbox" checked={complete} onChange={toggle} /><span><strong>{commitment.title}</strong><small>{commitmentSummary(commitment)}{synced ? " · synced from Life Edit" : ""}</small></span>{commitment.required && <em>Required</em>}</label>;
}

function CommitmentEditForm({ reset, commitment, pillars, data, save }: { reset: LifeResetProgram; commitment: ResetCommitment; pillars: string[]; data: LifeData; save: (event: FormEvent<HTMLFormElement>) => void }) {
  const stats = resetStats(data, reset);
  const disabled = statusFor(reset) === "active" && stats.editsRemaining <= 0;
  return <form onSubmit={save} className="lr-creator">
    {disabled && <p className="le-error">The structured adjustment allowance has been used for this active Reset.</p>}
    <Field label="Title"><input name="title" required defaultValue={commitment.title} /></Field>
    <div className="lr-form-grid"><Field label="Type"><select name="type" defaultValue={commitment.type}>{["daily", "specific-days", "weekly-quantity", "weekly-recurring", "avoidance", "limit", "photo"].map(item => <option key={item} value={item}>{item.replace("-", " ")}</option>)}</select></Field><Field label="Pillar"><select name="pillar" defaultValue={commitment.pillar}>{pillars.map(pillar => <option key={pillar}>{pillar}</option>)}</select></Field></div>
    <div className="lr-form-grid"><Field label="Weekly target"><input name="targetPerWeek" type="number" min={1} defaultValue={commitment.targetPerWeek ?? ""} /></Field><Field label="Photo every X days"><input name="everyNDays" type="number" min={1} defaultValue={commitment.everyNDays ?? ""} /></Field><Field label="Limit amount"><input name="limitAmount" type="number" min={1} defaultValue={commitment.limitAmount ?? ""} /></Field><Field label="Limit unit"><input name="limitUnit" defaultValue={commitment.limitUnit ?? ""} /></Field></div>
    <fieldset className="lr-fieldset"><legend>Scheduled days</legend><div className="lr-day-pills">{dayNames.map((day, index) => <label key={day}><input type="checkbox" name="scheduleDays" value={index} defaultChecked={commitment.scheduleDays?.includes(index)} />{day}</label>)}</div></fieldset>
    <div className="lr-form-grid"><Field label="Sync with"><select name="linkedFeature" defaultValue={commitment.linkedFeature ?? ""}><option value="">No sync</option>{["Fitness", "Habits", "Journal", "Planner", "Finance", "Goals", "Spiritual", "Focus"].map(item => <option key={item}>{item}</option>)}</select></Field><label className="le-check-row"><input name="required" type="checkbox" defaultChecked={commitment.required} />Required commitment</label></div>
    <p className="le-muted">Saving records a visible programme adjustment in the timeline.</p>
    <Button type="submit" disabled={disabled}><Check size={16} />Save adjustment</Button>
  </form>;
}

function ShareCardModal({ reset, data, updateReset, close }: { reset: LifeResetProgram; data: LifeData; updateReset: (id: string, patcher: (reset: LifeResetProgram) => LifeResetProgram) => void; close: () => void }) {
  const stats = resetStats(data, reset);
  const [message, setMessage] = useState("");
  const share = reset.share;
  function setShare<K extends keyof LifeResetProgram["share"]>(key: K, value: LifeResetProgram["share"][K]) {
    updateReset(reset.id, current => ({ ...current, share: { ...current.share, [key]: value } }));
  }
  function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" "); let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; } else line = next;
    }
    if (line) ctx.fillText(line, x, y);
    return y;
  }
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
  }
  async function generate() {
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920); bg.addColorStop(0, "#fff8ef"); bg.addColorStop(.42, "#edf5f7"); bg.addColorStop(1, "#ebdde8"); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "rgba(255,255,255,.55)"; roundRect(ctx, 92, 150, 896, 1600, 70); ctx.fill();
    ctx.strokeStyle = "#d8b06a"; ctx.lineWidth = 8; roundRect(ctx, 132, 205, 816, 1490, 52); ctx.stroke();
    ctx.fillStyle = "#26364a"; ctx.textAlign = "center"; ctx.font = "700 34px Arial"; ctx.fillText("THE LIFE EDIT", 540, 315);
    ctx.font = "96px Georgia"; drawWrapped(ctx, share.publicTitle || reset.publicName || reset.name, 540, 560, 760, 104);
    ctx.font = "210px Georgia"; ctx.fillStyle = "#c35b47"; ctx.fillText("Flame", 540, 850);
    ctx.fillStyle = "#26364a"; ctx.font = "56px Georgia"; ctx.fillText(`${reset.duration} days completed`, 540, 1010);
    let y = 1120;
    if (share.showDates) { ctx.font = "34px Arial"; ctx.fillText(`${formatDate(reset.startDate)} - ${formatDate(reset.endDate)}`, 540, y); y += 82; }
    if (share.showStats) { ctx.font = "42px Georgia"; ctx.fillText(`${stats.adherence}% adherence`, 540, y); y += 76; }
    if (share.showMisses) { ctx.font = "30px Arial"; ctx.fillText(`${stats.misses.length} missed commitment windows`, 540, y); y += 64; }
    if (share.showReflection && share.statement) { ctx.font = "44px Georgia"; drawWrapped(ctx, `"${share.statement}"`, 540, y + 30, 700, 58); }
    ctx.font = "28px Arial"; ctx.fillStyle = "#5b7184"; ctx.fillText("A season I chose with intention.", 540, 1550);
    const file = await new Promise<File>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(new File([blob], `life-reset-${reset.id}.png`, { type: "image/png" })) : reject(new Error("Could not create image")), "image/png", .95));
    const url = URL.createObjectURL(file); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
    setMessage("Keepsake image downloaded.");
  }
  return <Modal title="Completion keepsake" close={close}><div className="lr-share-preview"><div><p className="le-eyebrow">Public card</p><h2>{share.publicTitle || reset.publicName || reset.name}</h2><p>{share.statement || "A season I chose with intention."}</p><div className="lr-share-flame"><Flame size={48} /></div></div></div><div className="lr-privacy-grid"><Field label="Public wording"><input value={share.publicTitle} onChange={e => setShare("publicTitle", e.target.value)} /></Field><Field label="Personal statement"><textarea rows={3} value={share.statement} onChange={e => setShare("statement", e.target.value)} /></Field>{(["showName", "showDates", "showStats", "showMisses", "showPhotos", "showReflection"] as const).map(key => <label className="le-check-row" key={key}><input type="checkbox" checked={Boolean(share[key])} onChange={e => setShare(key, e.target.checked)} />{key.replace("show", "Show ")}</label>)}</div><div className="le-row"><Button onClick={() => void generate()}><Sparkles size={16} />Generate image</Button><Button secondary onClick={close}>Done</Button></div>{message && <p className="le-toast">{message}</p>}</Modal>;
}

export function nextScheduledReset(data: LifeData) {
  const date = today();
  return data.lifeResets.filter(reset => statusFor(reset, date) === "scheduled").sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}
