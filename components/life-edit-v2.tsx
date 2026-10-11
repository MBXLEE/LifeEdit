"use client";
import { InstallAppButton } from "./pwa-install";
import { ResetDemoData } from "./demo-controls";
import { WorkspaceHeading } from "./workspace-heading";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactElement, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Archive, Bell, BookOpen, Brain, Briefcase, CalendarDays, Check, ChevronRight, CircleDollarSign, Clock, Download, Dumbbell, Flower2, GraduationCap, HeartHandshake, Home, ImagePlus, Lightbulb, LogOut, Menu, Pause, Pencil, Play, Plus, RotateCcw, Settings, Sparkles, Sprout, Target, Trash2, TrendingUp, Users, X } from "lucide-react";
import { useLife, pillars, themeNames, uid, today, configured, type Goal, type Habit, type JournalPhoto, type LifeData, type VisionImportance, type Workout } from "@/lib/life-store";
import { clearAuthPersistence, createClient } from "@/lib/supabase/client";
import { WorkspaceNavigation, ExploreModules, profileName } from "./workspace-navigation";
import { InsightsWorkspace } from "./insights-workspace";
import { RelationshipsWorkspace } from "./relationships-workspace";
import { VisionWorkspace } from "./vision-workspace";
import { deleteMediaSource, MediaImage, MultiImageUpload, uploadMediaFile } from "./workspace-media";
import { budgetGuidanceSummary, defaultPillarStyles, improvementActions, reviewDue } from "@/lib/refinements";
import { FocusWorkspace } from "./focus-workspace";
import { BudgetWorkspace, FinanceWorkspace, PaydayCard } from "./finance-workspace";
import { FitnessWorkspace } from "./fitness-workspace";
import { CategoryManager, RecordManager, SocialWorkspace, SpiritualWorkspace } from "./record-manager";
import { requestNotificationPermission } from "./notification-manager";
import { LifeResetWorkspace, nextScheduledReset } from "./life-reset-workspace";

const navigation = [
  ["Home", "/dashboard", Home], ["Planner", "/planner", CalendarDays], ["Focus", "/focus", Clock], ["Life Edit", "/life-edit", Target], ["Journal", "/journal", BookOpen], ["Insights", "/insights", TrendingUp],
  ["Finance", "/finance", CircleDollarSign], ["Gym Planner", "/fitness", Dumbbell], ["Habit Manager", "/habits", Check], ["Quit Habits", "/quit-habits", Archive], ["Relationships", "/social", Home], ["Spiritual", "/spiritual", BookOpen], ["Settings", "/settings", Settings]
] as const;
const themeColors = ["#5B7C99", "#B5737A", "#5F8A67", "#9A7B4F", "#26364A"];
const defaultPillarStyleMap = new Map(defaultPillarStyles().map(style => [style.pillar, style]));
function activePillars(data: LifeData) { return data.lifePillars?.length ? data.lifePillars : pillars; }
function pillarPalette(data: LifeData, pillar: string) {
  const style = data.pillarStyles.find(row => row.pillar === pillar) ?? defaultPillarStyleMap.get(pillar) ?? defaultPillarStyleMap.get("Personal Growth");
  const base = style?.color ?? "#5b7c99";
  return { base, soft: `color-mix(in srgb, ${base} 14%, #fff)`, dark: `color-mix(in srgb, ${base} 72%, #111827)`, shades: [base, ...(style?.subcategories.map(item => item.color) ?? [])] };
}
function taskColor(data: LifeData, task: LifeData["tasks"][number]) {
  const palette = pillarPalette(data, task.pillar);
  const hash = [...task.title].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const accent = palette.shades[hash % palette.shades.length];
  return { "--pillar-base": palette.base, "--pillar-soft": palette.soft, "--pillar-dark": palette.dark, "--activity-color": accent } as CSSProperties;
}
const isTodoTask = (task: LifeData["tasks"][number]) => task.kind === "todo";
function Button({ children, onClick, type = "button", secondary = false, disabled = false, className = "" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; secondary?: boolean; disabled?: boolean; className?: string }) { return <button type={type} disabled={disabled} onClick={onClick} className={`le-button ${secondary ? "le-secondary" : ""} ${className}`.trim()}>{children}</button>; }
function SaveButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) { return <Button type="submit" disabled={disabled} className="le-compact-save"><Check size={16} />{children}</Button>; }
function IconButton({ title, children, onClick }: { title: string; children: ReactNode; onClick: () => void }) { return <button type="button" className="le-icon" title={title} aria-label={title} onClick={onClick}>{children}</button>; }
function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`le-card ${className}`}>{children}</section>; }
const Heading = WorkspaceHeading;
function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return <div className="le-field"><label htmlFor={id}>{label}</label>{Children.map(children, child => isValidElement(child) && typeof child.type === "string" && ["input", "textarea", "select"].includes(child.type) ? cloneElement(child as ReactElement<{ id: string }>, { id }) : child)}</div>;
}
function Empty({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) { return <div className="le-empty"><div className="le-empty-mark"><Plus size={22} /></div><h3>{title}</h3>{action && <Button onClick={onClick}><Plus size={16} />{action}</Button>}</div>; }
function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (v: string) => void }) { return <div className="le-tabs" role="tablist">{items.map(item => <button type="button" role="tab" aria-selected={active === item} key={item} onClick={() => onChange(item)}>{item}</button>)}</div>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; const count = Number(document.body.dataset.modalCount ?? "0"); if (!count) { const scrollY = window.scrollY; document.body.dataset.modalScrollY = String(scrollY); document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden"; document.body.style.position = "fixed"; document.body.style.top = `-${scrollY}px`; document.body.style.left = "0"; document.body.style.right = "0"; document.body.style.width = "100%"; } document.body.dataset.modalCount = String(count + 1); dialog?.showModal(); return () => { dialog?.close(); const next = Math.max(0, Number(document.body.dataset.modalCount ?? "1") - 1); if (next) { document.body.dataset.modalCount = String(next); return; } const scrollY = Number(document.body.dataset.modalScrollY ?? "0"); delete document.body.dataset.modalCount; delete document.body.dataset.modalScrollY; document.documentElement.style.overflow = ""; document.body.style.overflow = ""; document.body.style.position = ""; document.body.style.top = ""; document.body.style.left = ""; document.body.style.right = ""; document.body.style.width = ""; window.scrollTo(0, scrollY); }; }, []);
  return <dialog ref={ref} className="le-modal" aria-label={title} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="le-modal-header"><h2>{title}</h2><IconButton title="Close dialog" onClick={close}><X size={20} /></IconButton></div>{children}</dialog>;
}
function Progress({ value }: { value: number }) { const safe = Math.min(100, Math.max(0, value)); return <div className="le-progress" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${safe}%` }} /></div>; }
function Ring({ value, children }: { value: number; children: ReactNode }) { return <div className="le-ring"><svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="78" /><circle cx="90" cy="90" r="78" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - value} /></svg><div>{children}</div></div>; }
function AddCustom({ label, onAdd }: { label: string; onAdd: (value: string) => void }) {
  const [open, setOpen] = useState(false); const [text, setText] = useState("");
  return <>{!open ? <Button secondary onClick={() => setOpen(true)}><Plus size={16} />{label}</Button> : <div className="le-inline"><input aria-label={label} placeholder={label.replace("Add Custom ", "")} value={text} maxLength={120} onChange={e => setText(e.target.value)} /><Button disabled={!text.trim()} onClick={() => { onAdd(text.trim()); setText(""); setOpen(false); }}>Add</Button><IconButton title="Cancel custom option" onClick={() => setOpen(false)}><X size={16} /></IconButton></div>}</>;
}
function MultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (values: string[]) => void }) { return <div className="le-choices">{options.map(option => <button type="button" key={option} aria-pressed={selected.includes(option)} onClick={() => onChange(selected.includes(option) ? selected.filter(v => v !== option) : [...selected, option])}><span>{option}</span>{selected.includes(option) && <Check size={16} />}</button>)}</div>; }

export function LifeEditV2() { return <Workspace />; }
function Workspace() {
  const { data, ready, error, retry, account, undo, undoLabel, dismissUndo } = useLife();
  const path = usePathname(); const router = useRouter(); const [authError, setAuthError] = useState("");
  useEffect(() => { if (ready && account && !data.onboarded && path !== "/onboarding") router.replace("/onboarding"); }, [ready, account, data.onboarded, path, router]);
  async function logout() { try { if (configured()) { const { error } = await createClient().auth.signOut(); if (error) throw error; } clearAuthPersistence(); window.location.assign("/login"); } catch { setAuthError("Could not log out. Please try again."); } }
  if (!ready) return <main className="le-loading" aria-busy={!error}><p className="font-display text-4xl">The Life Edit</p><p>{error || "Opening your space..."}</p>{error && <Button onClick={retry}>Retry</Button>}</main>;
  if (path === "/life-reset") return <main className="lr-mode-root">{(error || authError) && <div role="alert" className="le-alert">{error || authError}<Button secondary onClick={retry}>Retry</Button></div>}<LifeResetWorkspace /></main>;
  return <WorkspaceNavigation path={path} logout={logout}>
      {(error || authError) && <div role="alert" className="le-alert">{error || authError}<Button secondary onClick={retry}>Retry</Button></div>}
      {undoLabel && <div className="le-undo" role="status"><span>{undoLabel}</span><Button secondary onClick={undo}><RotateCcw size={16} />Undo delete</Button><IconButton title="Dismiss undo" onClick={dismissUndo}><X size={16}/></IconButton></div>}
      <main key={path} className="le-content">{path === "/dashboard" ? <Dashboard /> : path === "/onboarding" ? <Onboarding /> : path === "/life-edit" ? <LifeEdit /> : path === "/life-reset" ? <LifeResetWorkspace /> : path === "/journal" ? <Journals /> : path === "/finance" ? <FinanceWorkspace /> : path === "/budget" ? <BudgetWorkspace /> : path === "/habits" ? <Habits direction="build" /> : path === "/quit-habits" ? <Habits direction="quit" /> : path === "/fitness" ? <FitnessWorkspace /> : path === "/planner" ? <Planner /> : path === "/focus" ? <FocusWorkspace /> : path === "/insights" ? <InsightsWorkspace /> : path === "/social" ? <RelationshipsWorkspace /> : path === "/spiritual" ? <SpiritualWorkspace /> : <Preferences />}</main>
    </WorkspaceNavigation>;

}

function Dashboard() {
  const { data, update } = useLife(); const router = useRouter(); const date = today();
  const tasks = data.tasks.filter(t => t.date === date); const habits = data.habits.filter(h => h.direction === "build");
  const signals = [...tasks.map(t => t.done), ...habits.map(h => h.dates.includes(date))];
  const score = signals.length ? Math.round(signals.filter(Boolean).length / signals.length * 100) : 0;
  const focus = data.focus.filter(f => f.date === date).reduce((sum, f) => sum + f.seconds, 0);
  const activeReset = data.lifeResets.find(reset => reset.status === "active" && reset.startDate <= date && reset.endDate >= date);
  const upcomingReset = nextScheduledReset(data);
  return <><Heading section={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} title={`${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}${profileName(data.name).first ? `, ${profileName(data.name).first}` : ""}.`}><Button onClick={() => router.push("/planner")}><Plus size={16} />Plan today</Button></Heading>
    {data.onboarded && reviewDue(data,today()) && <div className="le-welcome"><h2>Would you like to update your Life Balance Assessment?</h2><Link href="/insights">Review your life balance <ArrowRight size={16}/></Link></div>}
    {!data.onboarded && <div className="le-welcome"><div><h2>Make room for the life you want.</h2><p>Begin with your life assessment.</p></div><Button onClick={() => router.push("/onboarding")}>Begin your life edit <ArrowRight size={16} /></Button></div>}
    {(activeReset || upcomingReset) && <div className="lr-dashboard-reminder"><div><p className="le-eyebrow">{activeReset ? "Life Reset in progress" : "Upcoming Life Reset"}</p><h2>{activeReset ? `Continue ${activeReset.name} · Day ${Math.max(1, Math.ceil((Date.parse(`${date}T12:00:00`) - Date.parse(`${activeReset.startDate}T12:00:00`)) / 86400000) + 1)} of ${activeReset.duration}` : `${upcomingReset?.name} starts in ${Math.max(0, Math.ceil((Date.parse(`${upcomingReset?.startDate}T12:00:00`) - Date.parse(`${date}T12:00:00`)) / 86400000))} days.`}</h2></div><Link href={"/life-reset" as Route}>Open Life Reset <ArrowRight size={16}/></Link></div>}
    <div className="le-grid-main le-dashboard-overview"><Card><p className="le-eyebrow">Today&apos;s progress</p><div className="le-score-layout"><Ring value={score}><strong>{score}</strong><small>of 100</small></Ring><div><p className="le-mobile-score">{score}<small>%</small></p><h2>{signals.length ? "Every small step counts." : "A fresh beginning."}</h2><p className="le-muted">{signals.filter(Boolean).length} of {signals.length} daily commitments complete</p><div className="le-inline mt-5"><span className="le-chip">{Math.floor(focus / 60)} min focused</span><span className="le-chip">{data.journals.filter(j => j.date === date).length} reflections</span></div></div></div><div className="le-daily-stats"><div><strong>{tasks.filter(t => t.done).length}/{tasks.length}</strong><small>Tasks</small></div><div><strong>{habits.filter(h => h.dates.includes(date)).length}/{habits.length}</strong><small>Habits</small></div><div><strong>{Math.floor(focus / 60)}m</strong><small>Focus</small></div></div></Card><div className="le-affirmation"><p className="le-eyebrow">Today&apos;s affirmation</p><blockquote>I can build a meaningful life, one intentional choice at a time.</blockquote></div></div>
    <DailyBudgetWidget />
    <div className="le-grid-two mt-6"><Card><div className="le-row"><h2>Today&apos;s priorities</h2><Link href="/planner">View planner <ArrowRight size={14} /></Link></div>{!tasks.length ? <Empty title="Your day is a blank page." action="Add a priority" onClick={() => router.push("/planner")} /> : tasks.map(task => <label className="le-check-row" key={task.id}><input type="checkbox" checked={task.done} onChange={() => update(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) }))} /><span className={task.done ? "line-through le-muted" : ""}>{task.title}</span><small>{task.time}</small></label>)}</Card><Card><div className="le-row"><h2>Small daily promises</h2><Link href="/habits">Your habits <ArrowRight size={14} /></Link></div>{!habits.length ? <Empty title="No habits added yet." action="Add a habit" onClick={() => router.push("/habits")} /> : habits.map(habit => <label className="le-check-row" key={habit.id}><input type="checkbox" checked={habit.dates.includes(date)} onChange={() => update(d => ({ ...d, habits: d.habits.map(h => h.id === habit.id ? { ...h, dates: h.dates.includes(date) ? h.dates.filter(v => v !== date) : [...h.dates, date] } : h) }))} />{habit.name}</label>)}</Card></div>
    <div className="le-grid-three mt-6">{[["Life Edit", "Become who you imagine.", "/life-edit"], ["Budget", "Know what today can hold.", "/budget"], ["Finance", "Make your money intentional.", "/finance"]].map(([title, desc, href]) => <Link className="le-feature-link" href={href as Route} key={title}><p className="le-eyebrow">{title}</p><h2>{desc}</h2><ArrowRight size={20} /></Link>)}</div><ExploreModules /></>;
}

function DailyBudgetWidget() {
  const { data } = useLife(); const date = today();
  const currency = data.currencies.find(c => c.code === data.currency) ?? { code: data.currency, symbol: data.currency };
  const money = (v:number) => `${currency.symbol}${v.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`;
  const summary = budgetGuidanceSummary(data,date,data.currency);
  const plans=data.dailyBudgetPlans.filter(p=>p.currency===data.currency&&p.date===date);
  return <><PaydayCard guidance={summary} money={money} className="mt-6"/><Card className="le-daily-budget mt-6"><div className="le-row"><div><p className="le-eyebrow">Budget guidance</p><h2>Your pay-cycle budget, translated for today.</h2></div><Link href={"/budget" as Route}>Open Budget <ArrowRight size={14}/></Link></div>{!summary.monthlyBudget?<div className="le-budget-empty"><p>Create one pay-cycle budget in Budget to unlock weekly and daily guidance.</p><Link href={"/budget" as Route}>Create budget <ArrowRight size={14}/></Link></div>:<><div className="le-daily-budget-grid">{[["Cycle",summary.monthlyBudget],["This Week",Math.max(0,summary.weekRemaining)],["Today",Math.max(0,summary.todayRemaining)],["Planned",summary.plannedToday]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{money(Number(value))}</strong>{label==="Today"&&summary.todayRemaining<0&&<small className="le-budget-over">Tomorrow: {money(summary.tomorrowSuggested)}</small>}</div>)}</div><div className="le-budget-category-list"><div><div className="le-row"><span>{summary.health}</span><small>{summary.todayRemaining>=0?`${money(summary.todayRemaining)} available today`:`Tomorrow adjusts to ${money(summary.tomorrowSuggested)}`}</small></div><Progress value={summary.monthlyBudget>0?summary.monthlySpent/summary.monthlyBudget*100:0}/></div>{plans.slice(0,3).map(p=><div key={p.id}><div className="le-row"><span>{p.category}</span><small>{money(p.amount)} · {p.note||"Planned"}</small></div></div>)}</div></>}</Card></>;
}

function Onboarding() {
  const { data, update } = useLife(); const router = useRouter(); const [step, setStep] = useState(0); const [message, setMessage] = useState("");
  const steps = ["Welcome", "Assessment", "Priority Areas", "Habits to Build", "Habits to Quit", "Your Future Self", "Choose Your Theme", "Review & Confirm"];
  const currentPillars = activePillars(data);
  const set = <K extends keyof LifeData>(key: K, value: LifeData[K]) => update(d => ({ ...d, [key]: value }));
  function habit(name: string, direction: "build" | "quit") { update(d => { const found = d.habits.find(h => h.name === name && h.direction === direction); return { ...d, habits: found ? d.habits.filter(h => h.id !== found.id) : [...d.habits, { id: uid(), name, direction, dates: [], start: today(), setbacks: [] }] }; }); }
  function next() { if (step === 1 && currentPillars.some(p => !data.assessment[p])) { setMessage("Please rate each life pillar before continuing."); return; } if (step === 7) { if (currentPillars.some(p => !data.assessment[p])) { setStep(1); setMessage("Please complete each visible pillar rating."); return; } update(d => ({ ...d, onboarded: true, reviews:[...d.reviews,{id:uid(),date:today(),ratings:{...d.assessment},notes:d.onboarded?"Assessment updated":"Starting life assessment"}], improvementPlans:activePillars(d).filter(p=>(d.assessment[p]??0)>0&&(d.assessment[p]??0)<=5).map(p=>d.improvementPlans.find(plan=>plan.pillar===p)??{id:uid(),pillar:p,score:d.assessment[p],createdAt:today(),actions:improvementActions(p)}) })); router.push("/dashboard"); } else setStep(s => s + 1); setMessage(""); }
  return <><Heading section={data.onboarded ? "Your life, revisited" : "A beginning, made for you"} title={step === 0 ? "Become 1% better every day." : steps[step]} /><div className="le-onboarding"><nav aria-label="Onboarding steps">{steps.map((s, i) => <button key={s} aria-current={i === step ? "step" : undefined} onClick={() => { setStep(i); setMessage(""); }}><span>{i + 1}</span>{s}</button>)}</nav><div className="le-onboarding-body"><Progress value={(step + 1) / steps.length * 100} /><p className="le-step-count">Step {step + 1} of {steps.length}</p><div className="le-step" key={step}>
    {step === 0 && <><h2>Welcome to The Life Edit.</h2><p className="le-muted">A moment to consider where you are, and who you want to become.</p><Field label="What should we call you?"><input value={data.name} maxLength={80} onChange={e => set("name", e.target.value)} placeholder="Your name" /></Field></>}
    {step === 1 && <><p className="le-muted">How does each part of life feel today? 1 is unfulfilled, 10 is thriving.</p>{currentPillars.map(p => <Field key={p} label={`${p} · ${data.assessment[p] ?? "Not rated"}`}><input type="range" min="1" max="10" value={data.assessment[p] ?? 1} aria-label={`${p} rating`} onChange={e => set("assessment", { ...data.assessment, [p]: Number(e.target.value) })} /><div className="le-scale">{Array.from({ length: 10 }, (_, i) => <button type="button" key={i} aria-pressed={data.assessment[p] === i + 1} onClick={() => set("assessment", { ...data.assessment, [p]: i + 1 })}>{i + 1}</button>)}</div></Field>)}</>}
    {step === 2 && <><h2>What deserves your attention?</h2><MultiSelect options={data.areas} selected={data.priorities} onChange={v => set("priorities", v)} /><AddCustom label="Add Custom Area" onAdd={v => { update(d => ({ ...d, areas: [...new Set([...d.areas, v])], priorities: [...new Set([...d.priorities, v])] })); }} /></>}
    {(step === 3 || step === 4) && (() => { const direction = step === 3 ? "build" : "quit"; const options = [...new Set([...(step === 3 ? ["Hydration", "Reading", "Prayer", "Journaling", "Study", "Gym"] : ["Smoking", "Alcohol", "Energy Drinks", "Doom Scrolling", "Gambling", "Overspending"]), ...data.habits.filter(h => h.direction === direction).map(h => h.name)])]; return <><h2>{step === 3 ? "Small promises to keep." : "Time to quit bad habits."}</h2><div className="le-choices">{options.map(name => <button key={name} aria-pressed={data.habits.some(h => h.name === name && h.direction === direction)} onClick={() => habit(name, direction)}>{name}{data.habits.some(h => h.name === name && h.direction === direction) && <Check size={16} />}</button>)}</div><AddCustom label={step === 3 ? "Add Custom Habit" : "Add Custom Habit To Quit"} onAdd={v => { if (!data.habits.some(h => h.name === v && h.direction === direction)) habit(v, direction); }} /></>; })()}
    {step === 5 && <FutureFields />}{step === 6 && <ThemePicker />}
    {step === 7 && <><h2>Your next chapter.</h2><p className="le-muted">Review your selections. You can revisit them anytime in Settings.</p><dl className="le-review"><dt>Name</dt><dd>{data.name || "Not set"}</dd><dt>Life assessment</dt><dd>{currentPillars.map(p => `${p}: ${data.assessment[p] ?? "Not rated"}`).join(" · ")}</dd><dt>Focus areas</dt><dd>{data.priorities.join(", ") || "None selected"}</dd><dt>Habits to build</dt><dd>{data.habits.filter(h => h.direction === "build").map(h => h.name).join(", ") || "None selected"}</dd><dt>Habits to quit</dt><dd>{data.habits.filter(h => h.direction === "quit").map(h => h.name).join(", ") || "None selected"}</dd><dt>Future identity</dt><dd>{data.identity || "Not set"}</dd><dt>Vision</dt><dd>{data.vision || "Not set"}</dd><dt>Mission</dt><dd>{data.mission || "Not set"}</dd><dt>Lifestyle</dt><dd>{data.lifestyle || "Not set"}</dd><dt>Theme</dt><dd>{data.theme}</dd></dl></>}
    </div>{message && <p role="alert" className="le-error">{message}</p>}<div className="le-row mt-8"><Button secondary disabled={step === 0} onClick={() => setStep(s => s - 1)}><ArrowLeft size={16} />Back</Button><Button onClick={next}>{step === 7 ? "Complete life edit" : "Continue"}<ArrowRight size={16} /></Button></div></div></div></>;
}
function FutureFields() {
  const { data, update } = useLife();
  return <><div className="le-row"><p className="le-muted">One year from today, who do you want to become?</p><Button secondary onClick={() => update(d => ({ ...d, identity:"", vision:"", mission:"", lifestyle:"" }))}><Trash2 size={16}/>Delete future self profile</Button></div>{([["identity","Future identity"],["vision","Vision statement"],["mission","Personal mission"],["lifestyle","Future lifestyle description"]] as const).map(([key,label]) => <div key={key}><Field label={label}><textarea rows={3} value={data[key]} onChange={e => update(d => ({ ...d, [key]:e.target.value }))}/></Field>{data[key] && <IconButton title={`Delete ${label.toLowerCase()}`} onClick={() => update(d => ({ ...d, [key]:"" }))}><Trash2 size={16}/></IconButton>}</div>)}</>;
}
function ThemePicker() { const { data, update } = useLife(); return <div className="le-theme-grid">{themeNames.map((name, i) => <button key={name} aria-pressed={data.theme === name} onClick={() => update(d => ({ ...d, theme: name }))}><span style={{ background: themeColors[i] }} /><strong>{name}</strong>{data.theme === name && <Check size={18} />}</button>)}</div>; }
function PillarColorEditor() {
  const { data, update } = useLife();
  const [name, setName] = useState("");
  const defaults = defaultPillarStyles();
  const currentPillars = activePillars(data);
  function setPillarColor(pillar: string, color: string) {
    update(d => ({ ...d, pillarStyles: d.pillarStyles.some(style => style.pillar === pillar) ? d.pillarStyles.map(style => style.pillar === pillar ? { ...style, color } : style) : [...d.pillarStyles, { pillar, color, subcategories: [] }] }));
  }
  function resetColors() {
    update(d => ({ ...d, pillarStyles: d.pillarStyles.map(style => defaults.find(row => row.pillar === style.pillar) ?? style) }));
  }
  function addPillar() {
    const clean = name.trim();
    if (!clean || currentPillars.some(p => p.toLowerCase() === clean.toLowerCase())) return;
    const preset = defaults.find(row => row.pillar.toLowerCase() === clean.toLowerCase());
    update(d => ({ ...d, lifePillars: [...activePillars(d), clean], areas: [...new Set([...d.areas, clean])], pillarStyles: d.pillarStyles.some(style => style.pillar === clean) ? d.pillarStyles : [...d.pillarStyles, preset ?? { pillar: clean, color: "#5B7C99", subcategories: [] }] }));
    setName("");
  }
  function removePillar(pillar: string) {
    if (currentPillars.length <= 1) return;
    update(d => ({ ...d, lifePillars: activePillars(d).filter(item => item !== pillar), priorities: d.priorities.filter(item => item !== pillar) }));
  }
  function resetPillars() {
    update(d => ({ ...d, lifePillars: [...pillars], areas: [...new Set([...d.areas, ...pillars])], pillarStyles: d.pillarStyles.map(style => defaults.find(row => row.pillar === style.pillar) ?? style) }));
  }
  return <Card className="le-pillar-color-card"><div className="le-row"><div><p className="le-eyebrow">Life pillars</p><h2>Shape the pillars that make sense to you.</h2><p className="le-muted mt-3">The Life Edit starts with six pillars. Add your own focus areas, then colour-code the ones you use.</p></div><div className="le-inline"><Button secondary onClick={resetColors}><RotateCcw size={16} />Reset colours</Button><Button secondary onClick={resetPillars}><RotateCcw size={16} />Reset pillars</Button></div></div><div className="le-pillar-add"><input aria-label="New life pillar" placeholder="Intellectual Growth, Work Growth..." value={name} onChange={e => setName(e.target.value)} /><Button secondary disabled={!name.trim()} onClick={addPillar}><Plus size={16} />Add pillar</Button></div><div className="le-pillar-color-grid">{currentPillars.map(pillar => { const palette = pillarPalette(data, pillar); return <label key={pillar} className="le-color-row" style={{ "--pillar-base": palette.base, "--pillar-soft": palette.soft } as CSSProperties}><span><i />{pillar}</span><input type="color" value={palette.base} aria-label={`${pillar} colour`} onChange={e => setPillarColor(pillar, e.target.value)} /><button type="button" aria-label={`Remove ${pillar} pillar`} title={`Remove ${pillar} pillar`} onClick={e => { e.preventDefault(); removePillar(pillar); }}><X size={16}/></button></label>; })}</div></Card>;
}

function LifeEdit() {
  const { data, update } = useLife(); const [tab, setTab] = useState("Pillars"); const [editing, setEditing] = useState<Goal | null>(null); const [archived, setArchived] = useState(false); const ratings = data.reviews.slice().sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.ratings ?? data.assessment;
  const blank = (): Goal => ({ id: uid(), title: "", horizon: "Annual", parent: "", pillars: [], progress: 0, archived: false, due: "", notes: "", visionBoard: { enabled: false, images: [], phrase: "", importance: "Medium" } });
  const currentPillars = activePillars(data);
  return <><Heading section="The heart of your life edit" title="A life that feels like you."><Button onClick={() => setEditing(blank())}><Plus size={16} />Add Custom Goal</Button></Heading><section className="le-mobile-identity"><h2>{data.identity || "Your future self"}</h2><p>{data.vision || data.mission || "One intentional choice at a time."}</p><small>{data.goals.filter(g => !g.archived).length} active goals</small></section><Tabs items={["Pillars", "Goals & Vision", "Future Self"]} active={tab} onChange={setTab} />
    {tab === "Future Self" && <div className="le-grid-main mt-6"><div><FutureFields /></div><div className="le-affirmation"><p className="le-eyebrow">Your north star</p><blockquote>{data.identity || "The person you are becoming starts with the choices you make today."}</blockquote><p>{data.vision}</p></div></div>}
    {tab === "Goals & Vision" && <VisionWorkspace goalsView={<GoalsPanel data={data} update={update} archived={archived} setArchived={setArchived} edit={setEditing} create={() => setEditing(blank())} />} />}
    {tab === "Pillars" && <div className="le-grid-three mt-6">{currentPillars.map(p => <Card key={p}><p className="le-eyebrow">Life pillar</p><h2>{p}</h2><p className="le-metric">{ratings[p] ?? "—"}<small> / 10</small></p><p className="le-muted">{data.goals.filter(g => g.pillars.includes(p) && !g.archived).length} active goals</p><Link href="/onboarding">Revisit assessment <ArrowRight size={14} /></Link></Card>)}</div>}
    {editing && <GoalEditor goal={editing} close={() => setEditing(null)} />}
  </>;
}
function GoalsPanel({ data, update, archived, setArchived, edit, create }: { data: LifeData; update: (fn: (data: LifeData) => LifeData) => void; archived: boolean; setArchived: (value: boolean) => void; edit: (goal: Goal) => void; create: () => void }) {
  const visibleGoals = data.goals.filter(g => g.archived === archived);
  return <section className="le-goals-panel">
    <div className="le-row my-6"><div><p className="le-eyebrow">Goals</p><h2>Turn your vision into milestones.</h2><p className="le-muted">Keep goals structured and quiet here, while the vision board stays visual first.</p></div><div className="le-inline"><label className="le-inline"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)} />Show archived</label><Button onClick={create}><Plus size={16} />Add goal</Button></div></div>
    {!visibleGoals.length ? <Empty title="No goals here yet." action="Create your first goal" onClick={create} /> : ["Annual", "Quarterly", "Monthly", "Weekly"].map(horizon => <section key={horizon} className="mb-8"><div className="le-row"><div><p className="le-eyebrow">{horizon === "Annual" ? "Direction" : horizon === "Quarterly" ? "Milestones" : horizon === "Monthly" ? "Targets" : "Action plans"}</p><h2>{horizon === "Weekly" ? "Weekly execution" : `${horizon} goals`}</h2></div><span className="le-chip">{visibleGoals.filter(g => g.horizon === horizon).length} active</span></div><div className="le-grid-two mt-4">{visibleGoals.filter(g => g.horizon === horizon).map(g => <Card key={g.id} className={`le-goal-card ${g.progress === 100 ? "le-completed" : ""}`}><div className="le-row"><span className="le-chip">{g.pillars.join(" · ") || "Unassigned"}</span><div className="le-inline">{g.visionBoard?.enabled && <span className="le-chip"><ImagePlus size={14}/>Vision Board</span>}<IconButton title={`Edit ${g.title}`} onClick={() => edit(g)}><Pencil size={16} /></IconButton></div></div><h3 className="mt-5">{g.title}</h3>{g.parent && <p className="le-muted">Supports: {data.goals.find(p => p.id === g.parent)?.title ?? "Archived goal"}</p>}<p className="le-muted">{g.notes || "Add the next concrete action, milestone, or measure of success."}</p><div className="le-goal-execution"><div><span>Target</span><strong>{g.due || "Set date"}</strong></div><div><span>Progress</span><strong>{g.progress}%</strong></div><div><span>Next move</span><strong>{g.progress === 100 ? "Completed" : horizon === "Weekly" ? "Do it this week" : "Break into smaller steps"}</strong></div></div><Progress value={g.progress} /><div className="le-row mt-5"><Button secondary onClick={() => update(d => ({ ...d, goals: d.goals.map(item => item.id === g.id ? { ...item, progress: g.progress === 100 ? 0 : 100 } : item) }))}><Check size={16} />{g.progress === 100 ? "Reopen" : "Mark complete"}</Button><IconButton title={g.archived ? "Restore goal" : "Archive goal"} onClick={() => update(d => ({ ...d, goals: d.goals.map(item => item.id === g.id ? { ...item, archived: !item.archived } : item) }))}><Archive size={18} /></IconButton></div></Card>)}</div></section>)}
  </section>;
}
function GoalEditor({ goal, close }: { goal: Goal; close: () => void }) {
  const { data, update } = useLife(); const linkedVision = data.board.find(item => item.goalId === goal.id); const [draft, setDraft] = useState<Goal>({ ...goal, visionBoard: goal.visionBoard ?? (linkedVision ? { enabled: true, images: (linkedVision.images?.length ? linkedVision.images : linkedVision.url ? [linkedVision.url] : []).slice(0, 6), phrase: linkedVision.phrase ?? linkedVision.quote ?? "", importance: linkedVision.importance ?? "Medium" } : { enabled: false, images: [], phrase: "", importance: "Medium" }) }); const [error, setError] = useState(""); const [uploading, setUploading] = useState(false); const horizons = ["Annual", "Quarterly", "Monthly", "Weekly"]; const importanceOptions: VisionImportance[] = ["Low", "Medium", "High", "Very High"];
  const parents = data.goals.filter(g => !g.archived && g.id !== draft.id && horizons.indexOf(g.horizon) === horizons.indexOf(draft.horizon) - 1);
  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const vision = draft.visionBoard ?? { enabled: false, images: [], phrase: "", importance: "Medium" as VisionImportance };
    const images = vision.images.slice(0, 6);
    const phrase = vision.phrase.trim();
    if (!draft.pillars.length) { setError("Connect this goal to at least one life pillar."); return; }
    if (vision.enabled && !images.length && !phrase) { setError("Add at least one image or a word/phrase to show this goal on your Vision Board."); return; }
    const cleanGoal = { ...draft, title: draft.title.trim(), visionBoard: { ...vision, images, phrase } };
    update(d => {
      const goals = [...d.goals.filter(g => g.id !== cleanGoal.id).map(g => g.parent === cleanGoal.id && horizons.indexOf(g.horizon) !== horizons.indexOf(cleanGoal.horizon) + 1 ? { ...g, parent: "" } : g), cleanGoal];
      const existing = d.board.find(item => item.goalId === cleanGoal.id);
      const board = cleanGoal.visionBoard?.enabled
        ? [...d.board.filter(item => item.id !== existing?.id), { ...(existing ?? { id: uid(), kind: "Goal", category: cleanGoal.pillars[0] ?? "Goals", target: 0, saved: 0, currency: d.currency, coachNote: "" }), title: cleanGoal.title, url: images[0] ?? "", images, phrase, quote: phrase, importance: cleanGoal.visionBoard.importance, notes: cleanGoal.notes, goalId: cleanGoal.id }]
        : d.board.filter(item => item.goalId !== cleanGoal.id);
      return { ...d, goals, board };
    });
    close();
  }
  const vision = draft.visionBoard ?? { enabled: false, images: [], phrase: "", importance: "Medium" as VisionImportance };
  return <Modal title={goal.title ? "Edit goal" : "Create a goal"} close={close}><form onSubmit={saveGoal}><Field label="Goal title"><input autoFocus required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></Field><div className="le-grid-two"><Field label="Time horizon"><select value={draft.horizon} onChange={e => setDraft({ ...draft, horizon: e.target.value, parent: "" })}>{horizons.map(h => <option key={h}>{h}</option>)}</select></Field><Field label="Target date"><input type="date" value={draft.due} onChange={e => setDraft({ ...draft, due: e.target.value })} /></Field></div>{draft.horizon !== "Annual" && <Field label="Parent goal"><select value={draft.parent} onChange={e => setDraft({ ...draft, parent: e.target.value })}><option value="">Independent goal</option>{parents.map(p => <option value={p.id} key={p.id}>{p.title}</option>)}</select></Field>}<Field label="Life pillars"><MultiSelect options={activePillars(data)} selected={draft.pillars} onChange={v => setDraft({ ...draft, pillars: v })} /></Field><Field label={`Progress · ${draft.progress}%`}><input type="range" min="0" max="100" value={draft.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })} /></Field><Field label="Notes"><textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field><label className="le-check-row"><input type="checkbox" checked={vision.enabled} onChange={e => setDraft({ ...draft, visionBoard: { ...vision, enabled: e.target.checked } })} />Add to Vision Board</label>{vision.enabled && <section className="le-goal-vision-fields"><MultiImageUpload values={vision.images} onBusy={setUploading} onChange={images => setDraft(current => ({ ...current, visionBoard: { ...(current.visionBoard ?? vision), images } }))} /><Field label="Word or phrase"><input maxLength={60} value={vision.phrase} onChange={e => setDraft({ ...draft, visionBoard: { ...vision, phrase: e.target.value } })} placeholder="Confidence, Soft Life, My Future Home" /></Field><Field label="Importance"><select value={vision.importance} onChange={e => setDraft({ ...draft, visionBoard: { ...vision, importance: e.target.value as VisionImportance } })}>{importanceOptions.map(option => <option key={option}>{option}</option>)}</select></Field></section>}{error && <p role="alert" className="le-error">{error}</p>}<div className="le-row"><SaveButton disabled={uploading}>{uploading ? "Adding images..." : "Save goal"}</SaveButton>{data.goals.some(g => g.id === draft.id) && <Button secondary onClick={() => { update(d => ({ ...d, goals: d.goals.filter(g => g.id !== draft.id), board: d.board.filter(item => item.goalId !== draft.id) })); close(); }}><Trash2 size={16}/>Delete goal</Button>}</div></form></Modal>;
}

function pillarIcon(pillar: string) {
  const key = pillar.toLowerCase();
  if (key.includes("financ") || key.includes("money") || key.includes("budget")) return CircleDollarSign;
  if (key.includes("physical") || key.includes("fitness") || key.includes("health")) return Dumbbell;
  if (key.includes("mental") || key.includes("emotional")) return Brain;
  if (key.includes("social") || key.includes("relationship")) return Users;
  if (key.includes("spiritual") || key.includes("faith") || key.includes("prayer")) return Flower2;
  if (key.includes("academic") || key.includes("study") || key.includes("learn")) return GraduationCap;
  if (key.includes("career") || key.includes("work")) return Briefcase;
  if (key.includes("growth")) return Sprout;
  return Sparkles;
}
function pillarPromptLabel(pillar: string) {
  const lower = pillar.toLowerCase();
  if (lower.includes("financial")) return "financial well-being";
  if (lower.includes("physical")) return "physical well-being";
  if (lower.includes("mental") || lower.includes("emotional")) return "mental and emotional well-being";
  if (lower.includes("social")) return "social connection";
  if (lower.includes("spiritual")) return "spiritual life";
  if (lower.includes("growth")) return "personal growth";
  return `${pillar.toLowerCase()} progress`;
}
function notebookTone(data: LifeData, pillar: string, index: number) {
  const curated: Record<string, string> = {
    Financial: "#6f8068",
    Physical: "#bd7d6d",
    "Mental & Emotional": "#758ca0",
    Social: "#b17984",
    Spiritual: "#9180a6",
    "Personal Growth": "#b8895e"
  };
  const custom = ["#7f7867", "#6f8791", "#8b7f99", "#8a8365", "#93736f", "#72836f", "#7e7788", "#8a735e"];
  const palette = pillarPalette(data, pillar);
  const hash = [...pillar].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = curated[pillar] ?? (data.pillarStyles.some(style => style.pillar === pillar) ? `color-mix(in srgb, ${palette.base} 46%, ${custom[hash % custom.length]})` : custom[index % custom.length]);
  return {
    "--notebook-base": base,
    "--notebook-soft": `color-mix(in srgb, ${base} 18%, #fbf7f0)`,
    "--notebook-deep": `color-mix(in srgb, ${base} 78%, #2f2527)`,
    "--notebook-ink": `color-mix(in srgb, ${base} 34%, #fffaf2)`
  } as CSSProperties;
}

function Journals() {
  const { data, update, account } = useLife();
  const currentPillars = activePillars(data);
  const historicalPillars = [...new Set(data.journals.map(j => j.pillar).filter(p => p && !currentPillars.includes(p)))];
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [entry, setEntry] = useState<LifeData["journals"][number] | null>(null);
  const [rating, setRating] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [lightbox, setLightbox] = useState<JournalPhoto | null>(null);
  const savedEntry = entry ? data.journals.find(j => j.id === entry.id) : null;
  const photos = entry?.photos?.slice().sort((a,b)=>a.order-b.order) ?? [];
  const notebookPillar = selectedPillar && (currentPillars.includes(selectedPillar) || historicalPillars.includes(selectedPillar)) ? selectedPillar : null;
  const notebookEntries = notebookPillar ? data.journals.filter(j => j.pillar === notebookPillar).slice().sort((a,b)=>b.date.localeCompare(a.date) || b.id.localeCompare(a.id)) : [];
  const activeTemplates = notebookPillar ? data.templates.filter(t => t.pillar === notebookPillar) : [];
  const prompts = [...new Set(activeTemplates.flatMap(t => t.prompts))];
  function cleanupUnsavedPhotos(draft:LifeData["journals"][number]) { const saved=data.journals.find(j=>j.id===draft.id); const savedIds=new Set(saved?.photos?.map(photo=>photo.id)??[]); draft.photos?.filter(photo=>!savedIds.has(photo.id)).forEach(photo=>void deleteMediaSource(photo.source)); }
  function closeEntry() { if (entry) cleanupUnsavedPhotos(entry); setEntry(null); setPhotoBusy(false); setPhotoError(""); }
  function openEntry(j:LifeData["journals"][number]) { setSelectedPillar(j.pillar); setEntry({ ...j, photos: j.photos?.map(photo=>({ ...photo })) ?? [] }); setPhotoError(""); setRating(data.journalRatings.find(r=>r.journalId===j.id)?.rating ?? ""); }
  function create(pillar = notebookPillar) {
    if (!pillar) return;
    setMessage(""); setPhotoError("");
    const template = data.templates.find(t => t.pillar === pillar)?.id ?? "";
    setRating("");
    setEntry({ id: uid(), title: "", template, pillar, body: "", date: today(), photos: [] });
  }
  async function addPhotos(files:FileList|null) {
    if (!entry || !files?.length) return;
    setPhotoBusy(true); setPhotoError("");
    const accepted:JournalPhoto[]=[]; const failures:string[]=[];
    for (const file of Array.from(files)) {
      try {
        const source=await uploadMediaFile(file,{account,bucket:"journal-photos",folder:entry.id});
        accepted.push({ id: uid(), source, order: photos.length + accepted.length, name: file.name, createdAt: new Date().toISOString() });
      } catch(e) { failures.push(`${file.name}: ${e instanceof Error ? e.message : "Image could not be saved. Try again."}`); }
    }
    if (accepted.length) setEntry(current=>current?{...current,photos:[...(current.photos??[]),...accepted].map((photo,index)=>({...photo,order:index}))}:current);
    if (failures.length) setPhotoError(failures.length===1?failures[0]:`${failures.length} photos could not be added. ${failures[0]}`);
    setPhotoBusy(false);
  }
  function removePhoto(photo:JournalPhoto) {
    if (!entry) return;
    const wasSaved=savedEntry?.photos?.some(item=>item.id===photo.id) ?? false;
    if (!wasSaved) void deleteMediaSource(photo.source);
    setEntry({ ...entry, photos: photos.filter(item=>item.id!==photo.id).map((item,index)=>({ ...item, order:index })) });
  }
  function saveEntry(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!entry || photoBusy) return;
    const ordered={ ...entry, title: entry.title.trim(), body: entry.body.trim(), photos: photos.map((photo,index)=>({ ...photo, order:index })) };
    const removed=(savedEntry?.photos??[]).filter(photo=>!ordered.photos?.some(item=>item.id===photo.id));
    const existingRating=data.journalRatings.find(r=>r.journalId===entry.id);
    const journalRating=rating==="" ? null : { id:existingRating?.id ?? uid(), journalId:entry.id, pillar:entry.pillar, rating, date:entry.date };
    update(d => ({ ...d, journals: [...d.journals.filter(j => j.id !== entry.id), ordered], journalRatings: journalRating ? [...d.journalRatings.filter(r => r.journalId !== entry.id), journalRating] : d.journalRatings.filter(r => r.journalId !== entry.id) }));
    removed.forEach(photo=>void deleteMediaSource(photo.source));
    setEntry(null); setSelectedPillar(ordered.pillar); setMessage(rating==="" ? "Reflection saved." : "Reflection and daily rating saved."); setPhotoError("");
  }
  function deleteEntry() {
    if (!entry) return;
    photos.forEach(photo=>void deleteMediaSource(photo.source));
    update(d => ({ ...d, journals: d.journals.filter(j => j.id !== entry.id), journalRatings: d.journalRatings.filter(r=>r.journalId!==entry.id) }));
    setEntry(null); setPhotoError("");
  }
  if (!notebookPillar) return <><Heading section="Journal" title="Choose your journal." />
    <section className="le-notebook-library" aria-label="Journal notebooks">{currentPillars.map((pillar,index) => {
      const Icon = pillarIcon(pillar); const count = data.journals.filter(j => j.pillar === pillar).length; const latest = data.journals.filter(j => j.pillar === pillar).sort((a,b)=>b.date.localeCompare(a.date))[0]; const saved = latest ? data.journalRatings.find(r=>r.journalId===latest.id) : null;
      return <button key={pillar} type="button" className="le-notebook-book" style={notebookTone(data,pillar,index)} aria-label={`${pillar} journal${count ? `, ${count} ${count === 1 ? "entry" : "entries"}` : ""}${saved ? `, latest rating ${saved.rating} out of 10` : ""}`} onClick={() => { setSelectedPillar(pillar); setMessage(""); }}>
        <span className="le-book-spine" aria-hidden="true" /><span className="le-cover-frame" aria-hidden="true" /><span className="le-cover-signet" aria-hidden="true"><Icon size={28} /></span><strong>{pillar}</strong><span className="le-cover-line" aria-hidden="true" />
      </button>;
    })}</section>
    {historicalPillars.length > 0 && <section className="le-past-notebooks"><div className="le-row"><div><p className="le-eyebrow">Past notebooks</p><h2>Historical reflections</h2></div></div><div className="le-inline">{historicalPillars.map(pillar => <Button key={pillar} secondary onClick={() => setSelectedPillar(pillar)}><BookOpen size={16}/>{pillar}</Button>)}</div></section>}
    {message && <p role="status" className="le-toast">{message}</p>}</>;

  const activeNotebook = currentPillars.includes(notebookPillar);
  const NotebookIcon = pillarIcon(notebookPillar);
  return <><section className="le-journal-room" style={notebookTone(data,notebookPillar,currentPillars.indexOf(notebookPillar))}>
    <button type="button" className="le-back-link" onClick={() => { setSelectedPillar(null); setEntry(null); }}><ArrowLeft size={16}/>All journals</button>
    <div className="le-journal-room-cover"><span className="le-book-spine" aria-hidden="true" /><NotebookIcon size={52}/></div>
    <div><p className="le-eyebrow">{activeNotebook ? "Notebook" : "Past notebook"}</p><h1>{notebookPillar} Journal</h1>{prompts[0] && <p>{prompts[0]}</p>}</div>
    {activeNotebook && <Button onClick={() => create(notebookPillar)}><Pencil size={16} />New Entry</Button>}
  </section>
    <div className="le-grid-main mt-6"><section><div className="le-row mb-5"><div><p className="le-eyebrow">Previous entries</p><h2>{notebookEntries.length ? `${notebookEntries.length} saved ${notebookEntries.length === 1 ? "reflection" : "reflections"}` : "A quiet first page."}</h2></div></div>{!notebookEntries.length ? <Empty title="No reflections in this notebook yet." /> : <div className="le-entry-list">{notebookEntries.map(j => { const saved=data.journalRatings.find(r=>r.journalId===j.id); const count=j.photos?.length??0; const thumb=j.photos?.slice().sort((a,b)=>a.order-b.order)[0]; return <button key={j.id} className="le-entry le-entry-card" onClick={() => openEntry(j)}>{thumb && <MediaImage source={thumb.source} alt={thumb.name || "Journal entry photo"} />}<span><small>{j.date}{saved?` · ${saved.rating}/10`:""}{count?` · ${count} photo${count===1?"":"s"}`:""}</small><h3>{j.title || "Untitled reflection"}</h3><p>{j.body.slice(0, 120) || "No preview available."}</p></span><ArrowRight size={16} /></button>; })}</div>}</section>
      <aside className="le-notebook-side"><Card><p className="le-eyebrow">Optional prompts</p>{prompts.length ? prompts.slice(0,4).map((p,i)=><p key={i} className="le-prompt">{p}</p>) : <p className="le-muted">No prompts saved for this pillar.</p>}<Link href="/settings">Manage templates <ArrowRight size={14}/></Link></Card></aside></div>{message && <p role="status" className="le-toast">{message}</p>}
    {entry && <Modal title={data.journals.some(j => j.id === entry.id) ? "Edit reflection" : "New entry"} close={closeEntry}><form onSubmit={saveEntry} className="le-writing-form"><div className="le-entry-context" style={notebookTone(data,entry.pillar,0)}><NotebookIcon size={22}/><span>{entry.pillar} Journal</span></div><Field label="Date"><input type="date" required value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} /></Field><Field label="Title"><input value={entry.title} placeholder="Add a title (optional)" onChange={e => setEntry({ ...entry, title: e.target.value })} /></Field>{data.templates.find(t => t.id === entry.template)?.prompts?.length ? <div className="le-prompt-strip">{data.templates.find(t => t.id === entry.template)?.prompts.map((p, i) => <button type="button" key={i} onClick={() => setEntry(current => current ? { ...current, body: current.body ? `${current.body}\n\n${p}\n` : `${p}\n` } : current)}><Lightbulb size={14}/>{p}</button>)}</div> : null}<Field label="Reflection"><textarea required rows={12} placeholder="What's on your mind?" value={entry.body} onChange={e => setEntry({ ...entry, body: e.target.value })} /></Field><JournalPhotoPicker photos={photos} busy={photoBusy} error={photoError} addPhotos={addPhotos} removePhoto={removePhoto} viewPhoto={setLightbox} /><section className="le-rating-panel"><div className="le-row"><div><p className="le-eyebrow">Daily pillar rating</p><h3>How would you rate your {pillarPromptLabel(entry.pillar)} today?</h3></div>{rating!=="" && <Button secondary onClick={() => setRating("")}>Remove rating</Button>}</div><input aria-label={`${entry.pillar} daily rating`} type="range" min="1" max="10" value={rating==="" ? 5 : rating} onChange={e=>setRating(Number(e.target.value))}/><div className="le-scale">{Array.from({ length: 10 }, (_, i) => <button type="button" key={i} aria-pressed={rating === i + 1} onClick={() => setRating(i + 1)}>{i + 1}</button>)}</div><div className="le-rating-context"><span>Low</span><strong>{rating==="" ? "Optional" : `${rating}/10`}</strong><span>High</span></div></section><div className="le-row"><SaveButton disabled={photoBusy}>{photoBusy ? "Adding photos..." : "Save Entry"}</SaveButton>{data.journals.some(j => j.id === entry.id) && <Button secondary disabled={photoBusy} onClick={deleteEntry}><Trash2 size={16}/>Delete entry</Button>}</div></form></Modal>}
    {lightbox && <PhotoLightbox photo={lightbox} close={() => setLightbox(null)} />}
  </>;
}

function JournalPhotoPicker({ photos, busy, error, addPhotos, removePhoto, viewPhoto }: { photos: JournalPhoto[]; busy: boolean; error: string; addPhotos: (files: FileList | null) => Promise<void>; removePhoto: (photo: JournalPhoto) => void; viewPhoto: (photo: JournalPhoto) => void }) {
  return <section className="le-journal-photos-editor" aria-label="Attached photos">
    <div className="le-row">
      <div><p className="le-eyebrow">Memories</p><p className="le-muted">Attach optional photos that belong with this reflection.</p></div>
      <label className={`le-photo-add ${busy ? "is-busy" : ""}`}><ImagePlus size={16} />{busy ? "Adding..." : "Add photos"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => { void addPhotos(e.target.files); e.currentTarget.value = ""; }} /></label>
    </div>
    {error && <p role="alert" className="le-error">{error}</p>}
    {photos.length > 0 && <div className="le-journal-photo-grid">{photos.map(photo => <figure key={photo.id} className="le-journal-photo-tile">
      <button type="button" onClick={() => viewPhoto(photo)} aria-label={`View ${photo.name || "attached photo"}`}><MediaImage source={photo.source} alt={photo.name || "Attached journal photo"} /></button>
      <figcaption><span>{photo.name || "Attached photo"}</span><IconButton title="Remove photo" onClick={() => removePhoto(photo)}><X size={16}/></IconButton></figcaption>
    </figure>)}</div>}
  </section>;
}

function PhotoLightbox({ photo, close }: { photo: JournalPhoto; close: () => void }) {
  return <Modal title={photo.name || "Journal photo"} close={close}><div className="le-photo-lightbox"><MediaImage source={photo.source} alt={photo.name || "Journal photo"} /></div></Modal>;
}

function Habits({ direction }: { direction: "build" | "quit" }) {
  const { data, update } = useLife(); const [editing, setEditing] = useState<Habit | null>(null); const [setback, setSetback] = useState<string | null>(null); const [shareMessage, setShareMessage] = useState(""); const habits = data.habits.filter(h => h.direction === direction);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const add = () => setEditing({ id: uid(), name: "", direction, start: today(), dates: [], setbacks: [] });
  function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" "); let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, y);
    return y;
  }
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
  }
  async function createStreakStory(h: Habit, clean: number) {
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920); bg.addColorStop(0, "#f8fbff"); bg.addColorStop(.52, "#dcecf7"); bg.addColorStop(1, "#f8efe1"); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "rgba(255,255,255,.58)"; roundRect(ctx, 90, 150, 900, 1540, 72); ctx.fill();
    const inner = ctx.createLinearGradient(140, 210, 940, 1600); inner.addColorStop(0, "#6f8fab"); inner.addColorStop(.55, "#f5f7fb"); inner.addColorStop(1, "#d9b66f"); ctx.strokeStyle = inner; ctx.lineWidth = 10; roundRect(ctx, 132, 205, 816, 1430, 56); ctx.stroke();
    ctx.fillStyle = "#38546c"; ctx.font = "700 36px Arial"; ctx.textAlign = "center"; ctx.fillText("THE LIFE EDIT", 540, 310);
    ctx.fillStyle = "#17283a"; ctx.font = "88px Georgia"; drawWrapped(ctx, `You've been off ${h.name} for`, 540, 530, 740, 104);
    ctx.font = "220px Georgia"; ctx.fillText(String(clean), 540, 860);
    ctx.font = "700 56px Arial"; ctx.fillText(clean === 1 ? "DAY" : "DAYS", 540, 935);
    ctx.fillStyle = "#4f6f88"; ctx.font = "42px Georgia"; drawWrapped(ctx, "One intentional choice at a time.", 540, 1115, 660, 58);
    ctx.fillStyle = "#ffffff"; roundRect(ctx, 240, 1320, 600, 132, 66); ctx.fill();
    ctx.fillStyle = "#38546c"; ctx.font = "700 34px Arial"; ctx.fillText("Share your streak", 540, 1403);
    return await new Promise<File>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(new File([blob], `life-edit-${h.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${clean}-days.png`, { type: "image/png" })) : reject(new Error("Could not create image")), "image/png", .95));
  }
  async function shareStreak(h: Habit, clean: number) {
    const text = `I've been off ${h.name} for ${clean} ${clean === 1 ? "day" : "days"}. One intentional choice at a time.`;
    try {
      const file = await createStreakStory(h, clean);
      if (navigator.canShare?.({ files: [file] }) && navigator.share) await navigator.share({ title: "My Life Edit streak", text, files: [file] });
      else {
        const url = URL.createObjectURL(file); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
        await navigator.clipboard?.writeText(text); setShareMessage("Story image downloaded. You can upload it to Instagram, and the caption is copied.");
      }
    } catch { setShareMessage("Sharing was cancelled."); }
  }
  return <><Heading section={direction === "build" ? "Daily rituals" : "Letting go"} title={direction === "build" ? "Small promises. Real change." : "A little more freedom."}><Button onClick={add}><Plus size={16} />{direction === "build" ? "Add Custom Habit" : "Add Custom Habit To Quit"}</Button></Heading>{!habits.length ? <Empty title={direction === "build" ? "No habits added yet." : "No habits to quit added yet."} action="Create your first habit" onClick={add} /> : <div className="space-y-5">{habits.map(h => { const last = h.setbacks.at(-1)?.date.slice(0, 10) ?? h.start; const clean = Math.max(0, Math.floor((Date.parse(today()) - Date.parse(last)) / 86400000)); return <Card key={h.id} className={direction === "quit" ? "le-quit-card" : ""}><div className="le-row"><div><p className="le-eyebrow">{direction === "build" ? `${h.dates.filter(d => days.includes(d)).length} of 7 days` : `${clean} days since ${last}`}</p><h2>{h.name}</h2></div><div className="le-inline"><IconButton title={`Edit ${h.name}`} onClick={() => setEditing(h)}><Pencil size={16} /></IconButton><IconButton title={`Delete ${h.name}`} onClick={() => update(d => ({ ...d, habits: d.habits.filter(x => x.id !== h.id) }))}><Trash2 size={16} /></IconButton></div></div>{direction === "build" ? <div className="le-habit-days">{days.map(date => <button key={date} aria-label={`${h.name} ${date}`} aria-pressed={h.dates.includes(date)} onClick={() => update(d => ({ ...d, habits: d.habits.map(x => x.id === h.id ? { ...x, dates: x.dates.includes(date) ? x.dates.filter(v => v !== date) : [...x.dates, date] } : x) }))}><small>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</small><span>{h.dates.includes(date) ? <Check size={20} /> : date.slice(-2)}</span></button>)}</div> : <><div className="le-streak-layout"><div><Progress value={Math.min(100, clean / 30 * 100)} /><p className="le-muted mt-3">{clean < 30 ? `${30 - clean} days to your 30-day milestone` : "30-day milestone reached"}</p><div className="le-streak-share"><p><strong>Instagram story ready.</strong><br/>Create a polished share card for this streak.</p><Button secondary onClick={() => void shareStreak(h, clean)}>Share story</Button></div>{shareMessage && <p className="le-share-status" role="status">{shareMessage}</p>}</div><div className="le-streak-badge" aria-label={`${clean} day streak`}><div><strong>{clean}</strong><span>day streak</span></div></div></div><div className="le-row mt-5"><details><summary>Recovery log ({h.setbacks.length})</summary>{h.setbacks.map((s, i) => <p key={i} className="le-log">{new Date(s.date).toLocaleString()} · {s.note}</p>)}</details><Button secondary onClick={() => setSetback(h.id)}>Log a setback</Button></div></>}</Card>; })}</div>}
    {editing && <Modal title="Your habit" close={() => setEditing(null)}><form onSubmit={e => { e.preventDefault(); update(d => ({ ...d, habits: [...d.habits.filter(h => h.id !== editing.id), { ...editing, name: editing.name.trim() }] })); setEditing(null); }}><Field label="Habit name"><input required value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field>{direction === "quit" && <Field label="Quit date"><input required type="date" max={today()} value={editing.start} onChange={e => setEditing({ ...editing, start: e.target.value })} /></Field>}<SaveButton>Save habit</SaveButton></form></Modal>}
    {setback && <Modal title="Reflect, reset, continue." close={() => setSetback(null)}><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); update(d => ({ ...d, habits: d.habits.map(h => h.id === setback ? { ...h, setbacks: [...h.setbacks, { date: new Date().toISOString(), note: String(f.get("note")) }] } : h) })); setSetback(null); }}><Field label="What happened? What could help next time?"><textarea name="note" rows={4} required /></Field><p className="le-muted mb-4">This resets your current streak. Your history stays with you.</p><SaveButton>Save reflection and reset streak</SaveButton></form></Modal>}
  </>;
}

type PlannerTask = LifeData["tasks"][number];
type PlannerOccurrence = { task: PlannerTask; date: string; start: number; end: number; overlap: boolean };
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addPlannerDays = (value: string, amount: number) => { const d = new Date(`${value}T12:00:00`); d.setDate(d.getDate() + amount); return isoDate(d); };
const weekStart = (value: string) => { const d = new Date(`${value}T12:00:00`); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return isoDate(d); };
const clockToMinutes = (value: string) => { const [h, m] = value.split(":").map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 9 * 60; };
const clockLabel = (minutes: number) => { const dayOffset = Math.floor(minutes / 1440); const wrapped = ((minutes % 1440) + 1440) % 1440; return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}${dayOffset > 0 ? " +1d" : ""}`; };
const durationLabel = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60 ? `${minutes % 60}m` : Math.floor(minutes / 60) ? "" : "0m"}`.trim();
function occursOn(task: PlannerTask, day: string) {
  if (isTodoTask(task)) return false;
  const recurrence = task.recurrence ?? "none";
  if (recurrence === "none") return task.date === day;
  if (day < task.date || (task.recurrenceEnd && day > task.recurrenceEnd)) return false;
  const date = new Date(`${day}T12:00:00`), start = new Date(`${task.date}T12:00:00`);
  if (recurrence === "daily") return true;
  if (recurrence === "weekdays") return date.getDay() >= 1 && date.getDay() <= 5;
  return date.getDay() === start.getDay();
}
function occurrenceDone(task: PlannerTask, day: string) {
  return (task.recurrence && task.recurrence !== "none") ? Boolean(task.completedDates?.includes(day)) : task.done;
}
function occurrencesForDay(tasks: PlannerTask[], day: string): PlannerOccurrence[] {
  const items = tasks.filter(task => occursOn(task, day)).map(task => {
    const start = clockToMinutes(task.time);
    const end = start + Math.max(1, task.minutes || 1);
    return { task, date: day, start, end, overlap: false };
  }).sort((a, b) => a.start - b.start || a.end - b.end);
  return items.map((item, index) => ({ ...item, overlap: Boolean(items[index - 1] && item.start < items[index - 1].end) || Boolean(items[index + 1] && items[index + 1].start < item.end) }));
}

function Planner() {
  const { data, update } = useLife(); const [view, setView] = useState("Day"); const [date, setDate] = useState(today()); const [draft, setDraft] = useState<PlannerTask | null>(null); const [now, setNow] = useState(() => new Date()); const touchStart = useRef<number | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  const currentPillars = activePillars(data); const todayDate = today(); const dayOccurrences = occurrencesForDay(data.tasks, date);
  const todoTasks = data.tasks.filter(task => isTodoTask(task) && task.date === date).sort((a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title));
  const anchor = new Date(`${date}T12:00:00`); const weekStartDate = weekStart(date); const start = new Date(`${view === "Month" ? `${date.slice(0, 8)}01` : view === "Week" ? weekStartDate : date}T12:00:00`);
  const count = view === "Day" ? 1 : view === "Week" ? 7 : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => addPlannerDays(isoDate(start), i));
  const weekDays = Array.from({ length: 7 }, (_, i) => addPlannerDays(weekStartDate, i));
  const selectedLabel = anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const selectedMonth = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const add = () => setDraft({ id: uid(), title: "", date, time: "09:00", minutes: 30, pillar: currentPillars[0], done: false, kind: "time-block", recurrence: "none" });
  const addTodo = () => setDraft({ id: uid(), title: "", date, time: "", minutes: 0, pillar: currentPillars[0], done: false, kind: "todo", recurrence: "none" });
  const scheduleTodo = (task: PlannerTask) => setDraft({ ...task, kind: "time-block", date, time: "09:00", minutes: 30, recurrence: task.recurrence ?? "none" });
  const shiftDay = (amount: number) => setDate(addPlannerDays(date, amount));
  function toggleDone(task: PlannerTask, day = date) {
    update(d => ({ ...d, tasks: d.tasks.map(t => {
      if (t.id !== task.id) return t;
      if (t.recurrence && t.recurrence !== "none") {
        const completed = new Set(t.completedDates ?? []);
        if (completed.has(day)) completed.delete(day);
        else completed.add(day);
        return { ...t, completedDates: [...completed].sort() };
      }
      return { ...t, done: !t.done };
    }) }));
  }
  function saveTimeBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const cleanDraft: PlannerTask = { ...draft, title: draft.title.trim(), time: isTodoTask(draft) ? "" : draft.time, minutes: isTodoTask(draft) ? 0 : draft.minutes, recurrence: isTodoTask(draft) ? "none" : (draft.recurrence ?? "none"), recurrenceEnd: draft.recurrence === "none" ? "" : draft.recurrenceEnd };
    const minutesInput = event.currentTarget.elements.namedItem("duration-minutes");
    if (!isTodoTask(cleanDraft) && cleanDraft.minutes <= 0) {
      if (minutesInput instanceof HTMLInputElement) { minutesInput.setCustomValidity("Duration must be at least 1 minute."); event.currentTarget.reportValidity(); minutesInput.setCustomValidity(""); }
      return;
    }
    update(d => ({ ...d, tasks: [...d.tasks.filter(t => t.id !== cleanDraft.id), cleanDraft] }));
    setDate(cleanDraft.date || date); setDraft(null);
  }
  const timeline: ReactNode[] = [];
  let cursor = Math.min(8 * 60, dayOccurrences[0]?.start ?? 8 * 60);
  let nowPlaced = false;
  dayOccurrences.forEach(item => {
    if (date === todayDate && !nowPlaced && nowMinutes <= item.start) { timeline.push(<div key="now-before" className="le-now-line"><span>{clockLabel(nowMinutes)}</span><strong>Now</strong></div>); nowPlaced = true; }
    if (item.start - cursor >= 20) timeline.push(<div key={`gap-${item.task.id}`} className="le-time-gap"><span>{clockLabel(cursor)}</span><em>{durationLabel(item.start - cursor)} open</em></div>);
    const done = occurrenceDone(item.task, item.date);
    const height = Math.min(220, Math.max(76, item.task.minutes * 1.55));
    timeline.push(<div key={`${item.task.id}-${item.date}`} className={`le-timeline-row ${item.overlap ? "has-overlap" : ""}`}>
      <div className="le-time-stamp"><span>{clockLabel(item.start)}</span><small>{clockLabel(item.end)}</small></div>
      <button draggable onDragStart={e => e.dataTransfer.setData("text/plain", item.task.id)} type="button" className={`le-time-block le-timeline-block ${done ? "le-completed" : ""}`} style={{ ...taskColor(data, item.task), minHeight: `${height}px` }} onClick={() => setDraft(item.task)}>
        <span>{durationLabel(item.task.minutes)}{item.task.recurrence && item.task.recurrence !== "none" ? ` · ${item.task.recurrence}` : ""}</span>
        <strong>{item.task.title}</strong>
        <small>{item.task.notes || item.task.pillar}</small>
        {item.overlap && <em>Overlap</em>}
      </button>
      <button type="button" className="le-scratch-toggle" aria-label={`${done ? "Reopen" : "Complete"} ${item.task.title}`} aria-pressed={done} onClick={() => toggleDone(item.task, item.date)}>{done ? <Check size={18} /> : null}</button>
    </div>);
    if (date === todayDate && !nowPlaced && nowMinutes > item.start && nowMinutes < item.end) { timeline.push(<div key="now-inside" className="le-now-line is-inside"><span>{clockLabel(nowMinutes)}</span><strong>Now</strong></div>); nowPlaced = true; }
    cursor = Math.max(cursor, item.end);
  });
  if (date === todayDate && !nowPlaced) timeline.push(<div key="now-after" className="le-now-line"><span>{clockLabel(nowMinutes)}</span><strong>Now</strong></div>);
  const unfinishedPast = date < todayDate ? dayOccurrences.filter(item => !occurrenceDone(item.task, item.date) && (!item.task.recurrence || item.task.recurrence === "none")) : [];
  return <><Heading section="Make time for what matters" title="A day with intention."><div className="le-inline"><Button secondary onClick={addTodo}><Plus size={16} />Add to-do</Button><Button onClick={add}><Plus size={16} />Add time block</Button></div></Heading>
    <div className="le-planner-top"><div><p className="le-eyebrow">{selectedMonth}</p><h2>{selectedLabel}</h2></div><div className="le-inline"><Tabs items={["Day", "Week", "Month"]} active={view} onChange={setView} /><IconButton title="Previous day" onClick={() => shiftDay(-1)}><ArrowLeft size={18} /></IconButton><IconButton title="Next day" onClick={() => shiftDay(1)}><ArrowRight size={18} /></IconButton><Button secondary onClick={() => setDate(todayDate)}><CalendarDays size={16} />Today</Button><input aria-label="Planner date" type="date" required value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></div></div>
    <div className="le-date-strip" aria-label="Choose planner day">{weekDays.map(value => { const d = new Date(`${value}T12:00:00`); const dayCount = occurrencesForDay(data.tasks, value).length; return <button key={value} aria-label={d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} aria-pressed={value === date} className={value === todayDate ? "is-today" : ""} onClick={() => setDate(value)}><small>{d.toLocaleDateString(undefined, { weekday: "short" })}</small><strong>{d.getDate()}</strong>{dayCount > 0 && <i>{dayCount}</i>}</button>; })}</div>
    <div className="le-planner-layout"><div className={`le-calendar le-calendar-${view.toLowerCase()}`} onTouchStart={e => { touchStart.current = e.touches[0]?.clientX ?? null; }} onTouchEnd={e => { const startX = touchStart.current; if (startX === null) return; const delta = (e.changedTouches[0]?.clientX ?? startX) - startX; if (Math.abs(delta) > 70) shiftDay(delta < 0 ? 1 : -1); touchStart.current = null; }}>
      {view === "Day" ? <section className="le-day-timeline" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); update(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, kind: "time-block", date, time: t.time || "09:00", minutes: t.minutes || 30 } : t) })); }}>
        <div className="le-day-summary"><div><p className="le-eyebrow">Timeline</p><h2>{dayOccurrences.length ? `${dayOccurrences.length} planned ${dayOccurrences.length === 1 ? "activity" : "activities"}` : "Your day is yours to shape."}</h2></div><span>{dayOccurrences.filter(item => occurrenceDone(item.task, item.date)).length}/{dayOccurrences.length} complete</span></div>
        {dayOccurrences.length ? <div className="le-timeline-list">{timeline}</div> : <Empty title="Your day is yours to shape." action="Add a time block" onClick={add} />}
        {unfinishedPast.length > 0 && <div className="le-fresh-start"><p className="le-eyebrow">Fresh start</p><h3>Unfinished from this day</h3>{unfinishedPast.map(item => <div key={item.task.id} className="le-row"><span>{item.task.title}</span><Button secondary onClick={() => update(d => ({ ...d, tasks: d.tasks.map(t => t.id === item.task.id ? { ...t, date: todayDate } : t) }))}>Move to today</Button></div>)}</div>}
      </section> : <>
        {view === "Month" && Array.from({ length: (start.getDay() + 6) % 7 }, (_, i) => <div key={`blank-${i}`} className="le-calendar-blank" />)}
        {days.map(day => { const items = occurrencesForDay(data.tasks, day); return <section key={day} className={`le-calendar-day ${day === todayDate ? "is-today" : ""}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); update(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, kind: "time-block", date: day, time: t.time || "09:00", minutes: t.minutes || 30 } : t) })); }}><button className="le-day-label" onClick={() => { setDate(day); setView("Day"); }}>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</button>{items.map(item => <button draggable onDragStart={e => e.dataTransfer.setData("text/plain", item.task.id)} key={`${item.task.id}-${day}`} style={taskColor(data, item.task)} className={`le-time-block ${occurrenceDone(item.task, day) ? "le-completed" : ""}`} onClick={() => setDraft(item.task)}><small>{item.task.time} · {durationLabel(item.task.minutes)}</small><strong>{item.task.title}</strong><span>{item.task.pillar}</span></button>)}</section>; })}
      </>}</div>
      <Card className="le-todo-panel"><div className="le-row"><div><p className="le-eyebrow">To-do list</p><h2>Tasks for this day.</h2></div><Button secondary onClick={addTodo}><Plus size={16} />Add to-do</Button></div>{!todoTasks.length ? <Empty title="No checklist tasks for this day." action="Add a to-do" onClick={addTodo} /> : <div className="le-todo-list">{todoTasks.map(task => <div key={task.id} className={`le-todo-item ${task.done ? "is-done" : ""}`} style={taskColor(data, task)}><input aria-label={`Complete ${task.title}`} type="checkbox" checked={task.done} onChange={() => toggleDone(task)} /><button type="button" onClick={() => setDraft(task)}><strong>{task.title}</strong><span>{task.pillar}</span></button><IconButton title={`Schedule ${task.title}`} onClick={() => scheduleTodo(task)}><Clock size={16} /></IconButton></div>)}</div>}</Card></div>
    {draft && <Modal title={isTodoTask(draft) ? "Edit to-do" : "Plan your time"} close={() => setDraft(null)}><form onSubmit={saveTimeBlock}><Field label={isTodoTask(draft) ? "Task" : "Title"}><input required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></Field>{isTodoTask(draft) ? <><Field label="To-do date"><input type="date" required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field><Button secondary onClick={() => setDraft({ ...draft, kind: "time-block", date: draft.date || date, time: "09:00", minutes: 30, recurrence: "none" })}><Clock size={16} />Schedule this task</Button></> : <><div className="le-grid-two"><Field label="Date"><input type="date" required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field><Field label="Time"><input type="time" required value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} /></Field></div><fieldset><legend>Duration</legend><div className="le-grid-two"><Field label="Duration hours"><input type="number" min="0" max="24" step="1" value={Math.floor(draft.minutes / 60)} onChange={e => { const hours = Math.max(0, Math.min(24, e.target.value === "" ? 0 : Math.floor(Number(e.target.value)))); setDraft({ ...draft, minutes: hours * 60 + (hours === 24 ? 0 : draft.minutes % 60) }); }} /></Field><Field label="Duration minutes"><input name="duration-minutes" type="number" min="0" max={draft.minutes >= 1440 ? 0 : 59} step="1" value={draft.minutes % 60} onChange={e => setDraft({ ...draft, minutes: Math.floor(draft.minutes / 60) * 60 + Math.max(0, Math.min(draft.minutes >= 1440 ? 0 : 59, e.target.value === "" ? 0 : Math.floor(Number(e.target.value)))) })} /></Field></div></fieldset><div className="le-grid-two"><Field label="Repeats"><select value={draft.recurrence ?? "none"} onChange={e => setDraft({ ...draft, recurrence: e.target.value as PlannerTask["recurrence"] })}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option></select></Field><Field label="Repeat until"><input type="date" value={draft.recurrenceEnd ?? ""} disabled={!draft.recurrence || draft.recurrence === "none"} onChange={e => setDraft({ ...draft, recurrenceEnd: e.target.value })} /></Field></div><Button secondary onClick={() => setDraft({ ...draft, kind: "todo", time: "", minutes: 0, recurrence: "none", recurrenceEnd: "" })}>Unschedule</Button></>}<Field label="Notes"><textarea rows={3} value={draft.notes ?? ""} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field><Field label="Life pillar"><select required value={draft.pillar} onChange={e => setDraft({ ...draft, pillar: e.target.value })}>{[...new Set([...currentPillars, draft.pillar])].map(p => <option key={p}>{p}</option>)}</select></Field><div className="le-pillar-preview" style={taskColor(data, draft)}><i/><span>{draft.pillar}</span><strong>{draft.title || (isTodoTask(draft) ? "Checklist preview" : "Activity shade preview")}</strong></div><label className="le-check-row"><input type="checkbox" checked={occurrenceDone(draft, date)} onChange={() => setDraft(current => { if (!current) return current; if (current.recurrence && current.recurrence !== "none") { const completed = new Set(current.completedDates ?? []); if (completed.has(date)) completed.delete(date); else completed.add(date); return { ...current, completedDates: [...completed].sort() }; } return { ...current, done: !current.done }; })} />Completed</label><div className="le-row"><SaveButton>{isTodoTask(draft) ? "Save to-do" : "Save time block"}</SaveButton>{data.tasks.some(t => t.id === draft.id) && <IconButton title={isTodoTask(draft) ? "Delete to-do" : "Delete time block"} onClick={() => { update(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== draft.id) })); setDraft(null); }}><Trash2 size={18} /></IconButton>}</div></form></Modal>}
  </>;
}

function Insights() {
  const { data } = useLife(); const goals = data.goals.filter(g => !g.archived); const rated = pillars.filter(p => data.assessment[p]); const least = [...rated].sort((a, b) => data.assessment[a] - data.assessment[b])[0];
  return <><Heading section="The bigger picture" title="Notice how far you have come." /><div className="le-grid-three">{[["Goals completed", goals.filter(g => g.progress === 100).length], ["Reflections written", data.journals.length], ["Minutes focused", Math.round(data.focus.reduce((s, f) => s + f.seconds, 0) / 60)]].map(([label, value]) => <Card key={label}><p className="le-eyebrow">{label}</p><p className="le-metric">{value}</p></Card>)}</div><div className="le-grid-main mt-6"><Card><h2>Your life balance</h2>{!rated.length ? <Empty title="Your assessment will start the picture." /> : pillars.map(p => <div key={p} className="my-5"><div className="le-row"><strong>{p}</strong><span>{data.assessment[p] ?? "—"} / 10</span></div><Progress value={(data.assessment[p] ?? 0) * 10} /></div>)}<Link href="/onboarding">Revisit your life assessment <ArrowRight size={16} /></Link></Card><div className="le-affirmation"><p className="le-eyebrow">A gentle nudge</p><h2>{least ? `Make a little space for ${least.toLowerCase()}.` : "Start where you are."}</h2><p className="mt-4">{least ? "This was your lowest-rated pillar in your assessment. One small, intentional action can be a good place to begin." : "As you add your goals, habits, and reflections, your picture will become clearer."}</p></div></div></>;
}
function Preferences() {
  const { data, update } = useLife(); const [notice, setNotice] = useState("");
  const currentPillars = activePillars(data);
  const notificationLabels = [["focus","Focus mode"],["planner","Planner reminders"],["overdue","Overdue tasks"],["habits","Habit check-ins"],["workouts","Workout plans"],["journal","Journal time"],["finance","Financial check-ins"],["spiritual","Spiritual routines"],["goals","Goal milestones"]] as const;
  const notificationStatus = typeof window === "undefined" || !("Notification" in window) ? "unsupported" : Notification.permission;
  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    update(d => ({ ...d, notificationSettings: { ...d.notificationSettings, enabled: permission === "granted", permissionAsked: true } }));
    setNotice(permission === "granted" ? "Notifications are enabled for this browser." : permission === "unsupported" ? "This browser does not support notifications." : "Notifications were not enabled. You can keep using reminders inside the app.");
  }
  function setCategory(key: keyof LifeData["notificationSettings"]["categories"], value: boolean) {
    update(d => ({ ...d, notificationSettings: { ...d.notificationSettings, categories: { ...d.notificationSettings.categories, [key]: value } } }));
  }
  function setReminderTime(key: keyof LifeData["notificationSettings"]["reminderTimes"], value: string | number) {
    update(d => ({ ...d, notificationSettings: { ...d.notificationSettings, reminderTimes: { ...d.notificationSettings.reminderTimes, [key]: value } } }));
  }
  function exportData() { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = `the-life-edit-${today()}.json`; a.click(); URL.revokeObjectURL(url); setNotice("Your data export is ready."); }
  return <><Heading section="Make yourself at home" title="Your space. Your way." /><div className="mb-5"><InstallAppButton /></div><ResetDemoData /><div className="le-grid-main"><div><h2>Theme Studio</h2><p className="le-muted mb-5">Choose the feeling of your everyday.</p><ThemePicker /><div className="mt-8"><h2>Your profile</h2><Field label="Display name"><input value={data.name} maxLength={80} onChange={e => update(d => ({ ...d, name: e.target.value }))} /></Field><Link href="/onboarding"><Pencil size={16} />Edit assessment and onboarding selections</Link></div></div><Card><h2>Your data, in your hands.</h2><p className="le-muted my-5">Download your goals, journals, habits, and plans as a personal archive.</p><Button secondary onClick={exportData}><Download size={16} />Export my data</Button>{notice && <p role="status" className="mt-4">{notice}</p>}</Card></div><div className="mt-8"><PillarColorEditor /></div><Card className="mt-8"><div className="le-row"><div><p className="le-eyebrow">Notifications</p><h2>Gentle reminders, only where useful.</h2><p className="le-muted mt-3">The Life Edit can remind you about focus sessions, plans, and chosen wellbeing routines on this device.</p></div><Button onClick={enableNotifications} disabled={notificationStatus === "denied"}><Bell size={16} />{data.notificationSettings.enabled ? "Refresh permission" : "Enable notifications"}</Button></div>{notificationStatus === "denied" && <p className="le-error">Notifications are blocked in this browser. Change the site permission in your browser settings to enable them.</p>}<label className="le-check-row"><input type="checkbox" checked={data.notificationSettings.enabled} disabled={notificationStatus !== "granted"} onChange={e => update(d => ({ ...d, notificationSettings: { ...d.notificationSettings, enabled: e.target.checked } }))} />Use notifications on this device</label><div className="le-grid-three mt-5">{notificationLabels.map(([key,label]) => <label className="le-check-row" key={key}><input type="checkbox" checked={data.notificationSettings.categories[key]} onChange={e => setCategory(key, e.target.checked)} />{label}</label>)}</div><div className="le-grid-four le-reminder-grid mt-5"><Field label="Planner lead time (minutes)"><input type="number" min="0" max="1440" value={data.notificationSettings.reminderTimes.plannerLeadMinutes} onChange={e => setReminderTime("plannerLeadMinutes", Number(e.target.value))} /></Field><Field label="Habit reminder"><input type="time" value={data.notificationSettings.reminderTimes.habitTime} onChange={e => setReminderTime("habitTime", e.target.value)} /></Field><Field label="Journal reminder"><input type="time" value={data.notificationSettings.reminderTimes.journalTime} onChange={e => setReminderTime("journalTime", e.target.value)} /></Field><Field label="Spiritual reminder"><input type="time" value={data.notificationSettings.reminderTimes.spiritualTime} onChange={e => setReminderTime("spiritualTime", e.target.value)} /></Field><Field label="Finance reminder"><input type="time" value={data.notificationSettings.reminderTimes.financeTime} onChange={e => setReminderTime("financeTime", e.target.value)} /></Field></div><p className="le-muted">Browser reminders use your device time zone. Reliable delivery while the browser is fully closed depends on platform push support and a backend push service.</p></Card><div className="space-y-6 mt-8"><RecordManager collection="templates" title="Journal templates" singular="journal template" archive={false} fields={[{key:"name",label:"Journal name",required:true},{key:"pillar",label:"Life pillar",type:"select",options:currentPillars},{key:"prompts",label:"Prompts (one per line)",type:"lines",required:true}]} /><CategoryManager categoryKey="areas" title="Focus areas"/><CategoryManager categoryKey="focusTypes" title="Focus session types"/></div></>;
}



