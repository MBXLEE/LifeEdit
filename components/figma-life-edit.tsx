"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Droplets,
  Dumbbell,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  PenLine,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Square,
  Star,
  Sun,
  Target,
  Trophy
} from "lucide-react";

type Screen =
  | "Onboarding"
  | "Home"
  | "Planner"
  | "Focus"
  | "Journal"
  | "Life Edit"
  | "Insights"
  | "Finance"
  | "Gym Planner"
  | "Habit Manager"
  | "Quit Habits"
  | "Theme Studio";

type ThemeName = "Powder Blue" | "Blush Rose" | "Sage Green" | "Warm Cream" | "Midnight";
type PlannerView = "Day" | "Week" | "Month";
type LifeTab = "Pillars" | "Goals" | "Vision";
type FinanceTab = "Overview" | "Budget" | "Expenses" | "Savings";
type GymTab = "Workouts" | "Builder" | "Progress" | "Log";

const themes: Record<ThemeName, { bg: string; surface: string; soft: string; primary: string; deep: string; muted: string; icon: string }> = {
  "Powder Blue": { bg: "#E8EEF4", surface: "#FAFAFA", soft: "#DCEEFF", primary: "#5B7C99", deep: "#1A2332", muted: "#9BA5B5", icon: "PB" },
  "Blush Rose": { bg: "#F4EAEB", surface: "#FFFCFC", soft: "#F7E8E8", primary: "#B5737A", deep: "#2B2023", muted: "#A99599", icon: "BR" },
  "Sage Green": { bg: "#EAF1EA", surface: "#FCFDFC", soft: "#E8F0EA", primary: "#5F8A67", deep: "#1D2B20", muted: "#8E9B91", icon: "SG" },
  "Warm Cream": { bg: "#F2ECE1", surface: "#FFFCF7", soft: "#FFF5E6", primary: "#9A7B4F", deep: "#2B241A", muted: "#A79A86", icon: "WC" },
  Midnight: { bg: "#141B2A", surface: "#1A2332", soft: "#26364A", primary: "#8AAEC8", deep: "#F4F7FA", muted: "#8C98A8", icon: "MN" }
};

const groups: { title: string; screens: Screen[] }[] = [
  { title: "Setup", screens: ["Onboarding"] },
  { title: "Navigation", screens: ["Home", "Planner", "Focus", "Journal", "Life Edit", "Insights"] },
  { title: "Modules", screens: ["Finance", "Gym Planner", "Habit Manager", "Quit Habits"] },
  { title: "Settings", screens: ["Theme Studio"] }
];

const screenByPath: Record<string, Screen> = {
  "/dashboard": "Home",
  "/planner": "Planner",
  "/focus": "Focus",
  "/journal": "Journal",
  "/life-edit": "Life Edit",
  "/insights": "Insights",
  "/finance": "Finance",
  "/fitness": "Gym Planner",
  "/settings": "Theme Studio",
  "/onboarding": "Onboarding"
};

const screenIcons: Partial<Record<Screen, React.ElementType>> = {
  Onboarding: Star,
  Home,
  Planner: Calendar,
  Focus: Clock,
  Journal: FileText,
  "Life Edit": Target,
  Insights: LayoutDashboard,
  Finance: CircleDollarSign,
  "Gym Planner": Dumbbell,
  "Habit Manager": Check,
  "Quit Habits": Trophy,
  "Theme Studio": Settings
};

export function FigmaLifeEditRoute() {
  const initial = typeof window === "undefined" ? "Home" : screenByPath[window.location.pathname] ?? "Home";
  return <FigmaLifeEdit initialScreen={initial} />;
}

export function FigmaLifeEdit({ initialScreen = "Home" }: { initialScreen?: Screen }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [themeName, setThemeName] = useState<ThemeName>("Powder Blue");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = themes[themeName];

  return (
    <main className="min-h-screen" style={{ background: theme.bg, color: theme.deep }}>
      <div className="flex min-h-screen">
        {sidebarOpen && <Sidebar active={screen} setScreen={setScreen} theme={theme} />}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#E2E6ED] bg-white/82 px-4 py-3 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="grid h-10 w-10 place-items-center rounded-2xl border border-[#E2E6ED] bg-white" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle navigation">
                  <Menu size={18} color={theme.primary} />
                </button>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9BA5B5]">The Life Edit</p>
                  <h1 className="font-display text-xl md:text-2xl">Design your day with intention</h1>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-2xl bg-[#F2F4F7] p-1 md:flex">
                {(Object.keys(themes) as ThemeName[]).map((name) => (
                  <button key={name} className="h-7 rounded-xl px-2 text-[10px] font-bold transition" onClick={() => setThemeName(name)} style={{ background: name === themeName ? "#fff" : "transparent", color: name === themeName ? theme.primary : "#9BA5B5", boxShadow: name === themeName ? "0 2px 8px rgba(0,0,0,.06)" : "none" }}>
                    {themes[name].icon}
                  </button>
                ))}
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-8 md:py-8">
            <ScreenContent screen={screen} setScreen={setScreen} theme={theme} themeName={themeName} setThemeName={setThemeName} />
          </div>
        </section>
      </div>
      <MobileNav active={screen} setScreen={setScreen} theme={theme} />
    </main>
  );
}

function Sidebar({ active, setScreen, theme }: { active: Screen; setScreen: (screen: Screen) => void; theme: (typeof themes)[ThemeName] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-[#E2E6ED] bg-white/86 px-4 py-5 backdrop-blur md:block">
      <button onClick={() => setScreen("Home")} className="mb-8 flex w-full items-center gap-3 rounded-[24px] p-3 text-left" style={{ background: theme.soft }}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,.06)]">
          <span className="font-display text-lg" style={{ color: theme.primary }}>LE</span>
        </span>
        <span>
          <span className="block font-display text-2xl leading-none" style={{ color: theme.deep }}>The Life Edit</span>
          <span className="text-xs font-medium text-[#9BA5B5]">1% better every day</span>
        </span>
      </button>
      {groups.map((group) => (
        <div key={group.title} className="mb-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#9BA5B5]">{group.title}</p>
          <div className="space-y-1">
            {group.screens.map((screen) => {
              const Icon = screenIcons[screen] ?? Star;
              const selected = screen === active;
              return (
                <button key={screen} onClick={() => setScreen(screen)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition" style={{ background: selected ? theme.soft : "transparent", color: selected ? theme.primary : "#5A6478" }}>
                  <Icon size={17} />
                  <span className="flex-1">{screen}</span>
                  {selected && <ChevronRight size={15} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

function MobileNav({ active, setScreen, theme }: { active: Screen; setScreen: (screen: Screen) => void; theme: (typeof themes)[ThemeName] }) {
  const items: Screen[] = ["Home", "Planner", "Focus", "Journal", "Life Edit"];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E2E6ED] bg-white/95 px-2 pb-3 pt-2 backdrop-blur md:hidden">
      <div className="flex justify-around">
        {items.map((item) => {
          const Icon = screenIcons[item] ?? Star;
          const selected = active === item;
          return (
            <button key={item} className="flex min-w-0 flex-col items-center gap-1 px-2 py-1 text-[10px] font-semibold" onClick={() => setScreen(item)} style={{ color: selected ? theme.primary : "#9BA5B5" }}>
              <span className="rounded-xl p-1.5" style={{ background: selected ? theme.soft : "transparent" }}><Icon size={18} /></span>
              <span className="max-w-[56px] truncate">{item}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ScreenContent({ screen, setScreen, theme, themeName, setThemeName }: { screen: Screen; setScreen: (screen: Screen) => void; theme: (typeof themes)[ThemeName]; themeName: ThemeName; setThemeName: (theme: ThemeName) => void }) {
  if (screen === "Onboarding") return <Onboarding theme={theme} setScreen={setScreen} setThemeName={setThemeName} />;
  if (screen === "Home") return <HomeScreen theme={theme} setScreen={setScreen} />;
  if (screen === "Planner") return <Planner theme={theme} />;
  if (screen === "Focus") return <FocusScreen theme={theme} />;
  if (screen === "Journal") return <Journal theme={theme} />;
  if (screen === "Life Edit") return <LifeEditScreen theme={theme} />;
  if (screen === "Insights") return <Insights theme={theme} />;
  if (screen === "Finance") return <Finance theme={theme} />;
  if (screen === "Gym Planner") return <Gym theme={theme} />;
  if (screen === "Habit Manager") return <HabitManager theme={theme} />;
  if (screen === "Quit Habits") return <QuitHabits theme={theme} />;
  return <ThemeStudio themeName={themeName} setThemeName={setThemeName} />;
}

function PageHeader({ eyebrow, title, subtitle, action, theme }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode; theme: (typeof themes)[ThemeName] }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#9BA5B5]">{eyebrow}</p>
        <h2 className="font-display text-4xl leading-tight md:text-6xl" style={{ color: theme.deep }}>{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A6478]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,.06)] ${className}`} style={style}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#9BA5B5]">{children}</p>;
}

function Button({ children, onClick, theme, variant = "primary", className = "" }: { children: React.ReactNode; onClick?: () => void; theme: (typeof themes)[ThemeName]; variant?: "primary" | "soft" | "plain"; className?: string }) {
  const styles = variant === "primary" ? { background: theme.primary, color: "#fff" } : variant === "soft" ? { background: theme.soft, color: theme.primary } : { background: "#fff", color: theme.deep, borderColor: "#E2E6ED" };
  return <button onClick={onClick} className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${variant === "plain" ? "border" : ""} ${className}`} style={styles}>{children}</button>;
}

function Segment<T extends string>({ labels, active, onChange, theme }: { labels: readonly T[]; active: T; onChange: (value: T) => void; theme: (typeof themes)[ThemeName] }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-[#F2F4F7] p-1">
      {labels.map((label) => (
        <button key={label} onClick={() => onChange(label)} className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition" style={{ background: active === label ? "#fff" : "transparent", color: active === label ? theme.deep : "#9BA5B5", boxShadow: active === label ? "0 2px 8px rgba(0,0,0,.06)" : "none" }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Ring({ theme, size, value }: { theme: (typeof themes)[ThemeName]; size: number; value: number }) {
  const r = size / 2 - 8;
  const c = Math.PI * 2 * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.soft} strokeWidth="10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.primary} strokeWidth="10" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
    </svg>
  );
}

function Meter({ theme, label, value, sub, color }: { theme: (typeof themes)[ThemeName]; label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,.06)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: theme.deep }}>{label}</p>
        <p className="text-xs font-bold" style={{ color: color ?? theme.primary }}>{sub ?? `${value}%`}</p>
      </div>
      <div className="h-2 rounded-full bg-[#F2F4F7]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color ?? theme.primary }} />
      </div>
    </div>
  );
}

function HomeScreen({ theme, setScreen }: { theme: (typeof themes)[ThemeName]; setScreen: (screen: Screen) => void }) {
  const [tasks, setTasks] = useState([
    { title: "Gym Session", tag: "Fitness", done: true, color: "#6B9A72" },
    { title: "Complete Assignment", tag: "Study", done: false, color: theme.primary },
    { title: "Bible Study", tag: "Spiritual", done: false, color: "#9B8EC4" }
  ]);
  const [habits, setHabits] = useState([
    { label: "Water", icon: Droplets, active: true },
    { label: "Read", icon: BookOpen, active: false },
    { label: "Workout", icon: Dumbbell, active: true },
    { label: "Journal", icon: PenLine, active: false }
  ]);
  const completed = tasks.filter((task) => task.done).length + habits.filter((habit) => habit.active).length;

  return (
    <>
      <PageHeader eyebrow="Wednesday, 16 September" title="Good morning, Mbali" subtitle="A calm command center for today: priorities, habits, money, movement, reflection, and relationships in one place." theme={theme} action={<Button theme={theme} onClick={() => setScreen("Planner")}><Calendar className="mr-2 inline" size={16} /> Plan today</Button>} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden !p-0">
          <div className="grid gap-0 md:grid-cols-[1fr_280px]">
            <div className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#9BA5B5]">Today&apos;s Life Score</p>
              <div className="flex items-center gap-5">
                <div className="relative grid h-36 w-36 place-items-center">
                  <Ring theme={theme} size={144} value={78} />
                  <p className="absolute font-display text-5xl" style={{ color: theme.deep }}>78</p>
                </div>
                <div>
                  <p className="font-display text-3xl" style={{ color: theme.deep }}>You&apos;re aligned.</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5A6478]">Completed signals: {completed}/7. Keep the day spacious and deliberate.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["1/3 Tasks", "2/4 Habits", "1h 20m Focus", "R340 Spent"].map((item) => <span key={item} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: theme.soft, color: theme.primary }}>{item}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6" style={{ background: theme.soft }}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: theme.primary }}>Today&apos;s Affirmation</p>
              <p className="font-display text-2xl italic leading-snug" style={{ color: theme.primary }}>&quot;I am disciplined, focused, and building the life I deserve.&quot;</p>
            </div>
          </div>
        </Card>
        <Card>
          <Label>Top Priorities</Label>
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <button key={task.title} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left" style={{ background: task.done ? theme.soft : "#F7F8FA" }} onClick={() => setTasks((items) => items.map((item, i) => i === index ? { ...item, done: !item.done } : item))}>
                <span className="grid h-7 w-7 place-items-center rounded-xl border-2" style={{ background: task.done ? task.color : "#fff", borderColor: task.done ? task.color : "#E2E6ED" }}>{task.done && <Check size={14} color="#fff" />}</span>
                <span className="flex-1">
                  <span className={`block text-sm font-semibold ${task.done ? "line-through" : ""}`} style={{ color: task.done ? "#9BA5B5" : theme.deep }}>{task.title}</span>
                  <span className="text-xs text-[#9BA5B5]">{task.tag}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <Label>Habits</Label>
            <Button theme={theme} variant="soft" onClick={() => setScreen("Habit Manager")}>Open tracker</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {habits.map((habit, index) => {
              const Icon = habit.icon;
              return (
                <button key={habit.label} className="rounded-[22px] p-4 text-left transition hover:-translate-y-0.5" onClick={() => setHabits((items) => items.map((item, i) => i === index ? { ...item, active: !item.active } : item))} style={{ background: habit.active ? theme.primary : "#fff", boxShadow: "0 2px 14px rgba(0,0,0,.06)", color: habit.active ? "#fff" : theme.deep }}>
                  <Icon size={22} />
                  <p className="mt-4 text-sm font-semibold">{habit.label}</p>
                  <p className="text-xs opacity-70">{habit.active ? "Completed" : "Tap to complete"}</p>
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <Label>Upcoming</Label>
          {[["14:00", "Team Meeting"], ["18:30", "Gym - Leg Day"], ["20:00", "Evening Devotion"]].map(([time, title]) => (
            <div key={title} className="mb-3 flex items-center gap-3 rounded-2xl bg-[#F7F8FA] p-3">
              <p className="w-12 text-xs font-bold" style={{ color: theme.primary }}>{time}</p>
              <p className="text-sm font-semibold" style={{ color: theme.deep }}>{title}</p>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function Planner({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [view, setView] = useState<PlannerView>("Day");
  const [selected, setSelected] = useState("Deep Work Block");
  const [blocks, setBlocks] = useState([
    { time: "07:00", title: "Morning Workout", tag: "Fitness", duration: "60 min", color: "#6B9A72" },
    { time: "09:00", title: "Deep Work Block", tag: "Study", duration: "90 min", color: theme.primary },
    { time: "11:00", title: "Bible Study", tag: "Spiritual", duration: "30 min", color: "#9B8EC4" },
    { time: "14:00", title: "Team Meeting", tag: "Work", duration: "60 min", color: "#C9A96E" },
    { time: "18:30", title: "Gym - Leg Day", tag: "Fitness", duration: "90 min", color: "#6B9A72" }
  ]);
  const activeBlock = blocks.find((block) => block.title === selected) ?? blocks[0];

  return (
    <>
      <PageHeader eyebrow="Planner" title="Shape the day before it shapes you" subtitle="Switch views, select time blocks, and edit the active plan directly from the workspace." theme={theme} action={<Button theme={theme} onClick={() => setBlocks((items) => [...items, { time: "21:00", title: "Evening Journal", tag: "Reflection", duration: "30 min", color: "#D4848A" }])}><Plus className="mr-2 inline" size={16} /> Add block</Button>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <Segment labels={["Day", "Week", "Month"] as const} active={view} onChange={setView} theme={theme} />
          <div className="mt-5">
            {view === "Day" && (
              <div className="space-y-3">
                {blocks.map((block) => (
                  <button key={block.title} onClick={() => setSelected(block.title)} className="flex w-full items-stretch gap-4 rounded-[22px] p-3 text-left transition hover:-translate-y-0.5" style={{ background: selected === block.title ? theme.soft : "#F7F8FA" }}>
                    <div className="w-16 pt-3 text-right text-xs font-bold text-[#9BA5B5]">{block.time}</div>
                    <div className="flex-1 rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,.05)]" style={{ borderLeft: `4px solid ${block.color}` }}>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold" style={{ color: theme.deep }}>{block.title}</p>
                        <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: block.color }}>{block.tag}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#5A6478]">{block.duration}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {view === "Week" && <WeekGrid theme={theme} />}
            {view === "Month" && <MonthGrid theme={theme} />}
          </div>
        </Card>
        <Card>
          <Label>Edit Selected Block</Label>
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-[#E2E6ED] px-4 py-3 text-sm font-semibold outline-none" value={activeBlock.title} onChange={(event) => setBlocks((items) => items.map((block) => block.title === selected ? { ...block, title: event.target.value } : block))} />
            <input className="w-full rounded-2xl border border-[#E2E6ED] px-4 py-3 text-sm outline-none" value={activeBlock.time} onChange={(event) => setBlocks((items) => items.map((block) => block.title === selected ? { ...block, time: event.target.value } : block))} />
            <select className="w-full rounded-2xl border border-[#E2E6ED] px-4 py-3 text-sm outline-none" value={activeBlock.tag} onChange={(event) => setBlocks((items) => items.map((block) => block.title === selected ? { ...block, tag: event.target.value } : block))}>
              {["Fitness", "Study", "Spiritual", "Work", "Reflection"].map((tag) => <option key={tag}>{tag}</option>)}
            </select>
            <Button theme={theme} variant="soft" className="w-full" onClick={() => setBlocks((items) => items.filter((block) => block.title !== selected))}>Remove block</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function WeekGrid({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
        <div key={day} className="min-h-48 rounded-[22px] bg-[#F7F8FA] p-3">
          <p className="mb-3 text-xs font-bold text-[#9BA5B5]">{day}</p>
          {[0, 1, 2].slice(0, index % 3 + 1).map((item) => <div key={item} className="mb-2 rounded-2xl bg-white p-3 text-xs font-semibold shadow-[0_2px_10px_rgba(0,0,0,.04)]" style={{ color: theme.deep }}>Focus block</div>)}
        </div>
      ))}
    </div>
  );
}

function MonthGrid({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }, (_, i) => (
        <button key={i} className="aspect-square rounded-2xl bg-[#F7F8FA] p-2 text-left text-xs font-semibold transition hover:-translate-y-0.5" style={{ color: i === 15 ? "#fff" : theme.deep, background: i === 15 ? theme.primary : "#F7F8FA" }}>
          {i + 1}
          {i % 5 === 0 && <span className="mt-2 block h-1.5 w-1.5 rounded-full" style={{ background: i === 15 ? "#fff" : theme.primary }} />}
        </button>
      ))}
    </div>
  );
}

function FocusScreen({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const presets = { "25/5": 25 * 60, "50/10": 50 * 60, "90/20": 90 * 60 };
  const [preset, setPreset] = useState<keyof typeof presets>("25/5");
  const [seconds, setSeconds] = useState(presets[preset]);
  const [running, setRunning] = useState(false);
  const [sessionType, setSessionType] = useState("Study");
  const [history, setHistory] = useState(["Deep Work - 50 min", "Reading - 25 min", "Study - 90 min"]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function changePreset(value: keyof typeof presets) {
    setPreset(value);
    setSeconds(presets[value]);
    setRunning(false);
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  const progress = 100 - (seconds / presets[preset]) * 100;

  return (
    <>
      <PageHeader eyebrow="Focus" title="Deep work, beautifully contained" subtitle="The timer, preset tabs, session type, reset, and history all respond now." theme={theme} action={<Button theme={theme} onClick={() => { setHistory((items) => [`${sessionType} - ${preset.split("/")[0]} min`, ...items]); setRunning(false); }}>Save session</Button>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card className="grid place-items-center">
          <div className="mb-6 w-full max-w-md">
            <Segment labels={Object.keys(presets) as (keyof typeof presets)[]} active={preset} onChange={changePreset} theme={theme} />
          </div>
          <div className="relative grid h-80 w-80 place-items-center">
            <Ring theme={theme} size={320} value={progress} />
            <div className="absolute text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#9BA5B5]">{sessionType}</p>
              <p className="font-display text-7xl" style={{ color: theme.deep }}>{minutes}:{rest}</p>
              <p className="mt-2 text-sm text-[#9BA5B5]">{preset} Pomodoro</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button theme={theme} variant="plain" onClick={() => { setSeconds(presets[preset]); setRunning(false); }}><RotateCcw className="mr-2 inline" size={16} /> Reset</Button>
            <Button theme={theme} className="px-8" onClick={() => setRunning((value) => !value)}>{running ? <Square className="mr-2 inline" size={16} /> : <Play className="mr-2 inline" size={16} />} {running ? "Pause" : "Start"}</Button>
          </div>
        </Card>
        <div className="space-y-5">
          <Card>
            <Label>Session Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Study", "Deep Work", "Reading", "Work", "Custom"].map((type) => <Button key={type} theme={theme} variant={sessionType === type ? "primary" : "soft"} onClick={() => setSessionType(type)}>{type}</Button>)}
            </div>
          </Card>
          <Card>
            <Label>This Week</Label>
            <div className="grid grid-cols-3 gap-3">
              {[["12.5h", "Hours"], ["18", "Sessions"], ["6", "Streak"]].map(([a, b]) => <div key={b} className="rounded-2xl bg-[#F7F8FA] p-3 text-center"><p className="font-display text-2xl" style={{ color: theme.deep }}>{a}</p><p className="text-xs text-[#9BA5B5]">{b}</p></div>)}
            </div>
          </Card>
          <Card>
            <Label>Focus History</Label>
            {history.map((item) => <div key={item} className="mb-2 rounded-2xl bg-[#F7F8FA] p-3 text-sm font-semibold" style={{ color: theme.deep }}>{item}</div>)}
          </Card>
        </div>
      </div>
    </>
  );
}

function Journal({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [selected, setSelected] = useState("Morning Reflection");
  const [entry, setEntry] = useState("Today I want to be focused, calm, and honest with my energy.");
  const journals = [
    ["Morning Reflection", "How do I feel today? What matters most?", Sun, "#C9A96E"],
    ["Evening Reflection", "What went well? What did I learn?", Moon, "#9B8EC4"],
    ["Gratitude Journal", "Three things I am grateful for.", Heart, "#D4848A"],
    ["Prayer Journal", "Prayer requests and reflections.", BookOpen, theme.primary],
    ["Brain Dump", "Loose thoughts without pressure.", FileText, "#6B9A72"],
    ["Monthly Review", "Patterns, lessons, and next edits.", Calendar, "#8AAEC8"]
  ] as const;
  const current = journals.find(([title]) => title === selected) ?? journals[0];
  const CurrentIcon = current[2];

  return (
    <>
      <PageHeader eyebrow="Journal" title="A premium notebook for your inner life" subtitle="Open any journal type, write directly, and save entries into the recent list." theme={theme} action={<Button theme={theme}>Save entry</Button>} />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <Label>Journal Types</Label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {journals.map(([title, sub, Icon, color]) => (
              <button key={title} onClick={() => setSelected(title)} className="rounded-[22px] p-4 text-left transition hover:-translate-y-0.5" style={{ background: selected === title ? theme.soft : "#F7F8FA" }}>
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${color}22` }}><Icon size={18} color={color} /></div>
                <p className="text-sm font-semibold" style={{ color: theme.deep }}>{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5A6478]">{sub}</p>
              </button>
            ))}
          </div>
        </Card>
        <Card className="min-h-[620px]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: theme.soft }}><CurrentIcon size={20} color={theme.primary} /></div>
              <h3 className="font-display text-4xl" style={{ color: theme.deep }}>{selected}</h3>
              <p className="mt-2 text-sm text-[#5A6478]">{current[1]}</p>
            </div>
            <div className="rounded-2xl bg-[#F7F8FA] p-3 text-center">
              <p className="font-display text-2xl" style={{ color: theme.deep }}>21</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9BA5B5]">Day streak</p>
            </div>
          </div>
          <textarea className="min-h-[360px] w-full resize-none rounded-[24px] border border-[#E2E6ED] bg-[#FAFAFA] p-5 font-display text-2xl leading-relaxed outline-none" value={entry} onChange={(event) => setEntry(event.target.value)} style={{ color: theme.deep }} />
        </Card>
      </div>
    </>
  );
}

function LifeEditScreen({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [tab, setTab] = useState<LifeTab>("Pillars");
  return (
    <>
      <PageHeader eyebrow="Life Edit" title="Design the future self, then backfill the day" subtitle="Pillars, goals, and vision board are separate clickable workspaces now." theme={theme} action={<Button theme={theme}><Plus className="mr-2 inline" size={16} /> Add goal</Button>} />
      <Card className="mb-5 !p-0">
        <div className="rounded-[24px] p-7 text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, #3D5B73)` }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest opacity-80">Future Identity</p>
          <p className="font-display text-4xl leading-tight md:text-5xl">Disciplined, grounded, healthy, financially wise, and spiritually present.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[["Word", "Expansion"], ["Year", "2026"], ["Alignment", "78%"]].map(([a, b]) => <div key={a} className="rounded-2xl bg-white/15 p-4"><p className="text-[10px] uppercase tracking-widest opacity-75">{a}</p><p className="font-display text-2xl">{b}</p></div>)}
          </div>
        </div>
      </Card>
      <div className="mb-5 max-w-xl"><Segment labels={["Pillars", "Goals", "Vision"] as const} active={tab} onChange={setTab} theme={theme} /></div>
      {tab === "Pillars" && <PillarsPanel theme={theme} />}
      {tab === "Goals" && <GoalsPanel theme={theme} />}
      {tab === "Vision" && <VisionPanel theme={theme} />}
    </>
  );
}

function PillarsPanel({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const pillars = [["Financial", 76, "#C9A96E"], ["Physical", 82, "#6B9A72"], ["Mental", 71, theme.primary], ["Social", 58, "#D4848A"], ["Spiritual", 88, "#9B8EC4"], ["Growth", 79, "#8AAEC8"]] as const;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pillars.map(([label, value, color]) => <Meter key={label} theme={theme} label={label} value={value} color={color} />)}</div>;
}

function GoalsPanel({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return <div className="grid gap-5 lg:grid-cols-3">{[["Annual", "Become debt-light and strong in body"], ["Quarterly", "Save R8,000 and complete 36 workouts"], ["Monthly", "20 workouts, 18 journal entries, one family dinner"]].map(([period, goal]) => <Card key={period}><Label>{period}</Label><p className="font-display text-3xl" style={{ color: theme.deep }}>{goal}</p><Button theme={theme} variant="soft" className="mt-5">Edit {period.toLowerCase()}</Button></Card>)}</div>;
}

function VisionPanel({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="grid min-h-[420px] grid-cols-4 grid-rows-3 gap-3"><div className="col-span-2 row-span-2 rounded-[32px]" style={{ background: `linear-gradient(135deg, ${theme.soft}, #E8F0EA)` }} /><div className="rounded-[28px] bg-[#FFF5E6]" /><div className="rounded-[28px] bg-[#F7E8E8]" /><div className="rounded-[28px] bg-[#F0EEF9]" /><div className="col-span-2 rounded-[28px]" style={{ background: theme.soft }} /><div className="rounded-[28px] bg-[#E8F0EA]" /><div className="rounded-[28px] bg-[#DCEEFF]" /></div><Card><Label>Vision Notes</Label><textarea className="min-h-72 w-full resize-none rounded-2xl border border-[#E2E6ED] p-4 text-sm outline-none" defaultValue="A peaceful home, a strong body, consistent prayer, spacious finances, and work that feels focused." /></Card></div>;
}

function Insights({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return (
    <>
      <PageHeader eyebrow="Insights" title="Signals without the noise" subtitle="Balance trends, habit patterns, and intelligent recommendations across your life pillars." theme={theme} />
      <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
        <Card className="text-center">
          <Label>Life Wheel</Label>
          <svg viewBox="0 0 220 210" className="mx-auto h-72 w-72">
            <polygon points="110,20 187,65 187,145 110,190 33,145 33,65" fill={theme.soft} stroke="#E2E6ED" />
            <polygon points="110,45 158,73 164,135 110,162 61,130 70,76" fill={`${theme.primary}35`} stroke={theme.primary} strokeWidth="3" />
            <circle cx="110" cy="105" r="5" fill={theme.primary} />
          </svg>
          <p className="font-display text-5xl" style={{ color: theme.deep }}>78%</p>
          <p className="text-sm text-[#5A6478]">Overall monthly alignment</p>
        </Card>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            {[["Goal Rate", "64%"], ["Habit Trend", "84%"], ["Focus", "12.5h"], ["Savings", "18%"]].map(([a, b]) => <Card key={a}><p className="text-[10px] font-semibold uppercase tracking-widest text-[#9BA5B5]">{a}</p><p className="font-display text-3xl" style={{ color: theme.primary }}>{b}</p></Card>)}
          </div>
          <Card>
            <Label>Smart Balance Insights</Label>
            {["Your Social pillar has received less attention this month. Consider reaching out to someone important.", "You are behind your monthly savings target by R1,130.", "Reflection entries dipped for three days. A short evening note may help reset the pattern."].map((item) => <div key={item} className="mb-3 rounded-2xl p-4 text-sm leading-relaxed" style={{ background: theme.soft, color: theme.deep }}>{item}</div>)}
          </Card>
          <Card>
            <Label>Weekly Progress</Label>
            <div className="flex h-28 items-end gap-3">{[42, 58, 24, 66, 72, 38, 80].map((h, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl" style={{ height: h, background: i > 4 ? theme.primary : theme.soft }} /><span className="text-xs text-[#9BA5B5]">{"MTWTFSS"[i]}</span></div>)}</div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Finance({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [tab, setTab] = useState<FinanceTab>("Overview");
  const [currency, setCurrency] = useState("ZAR");
  const [income, setIncome] = useState(28000);
  const [spent, setSpent] = useState(19470);
  const symbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "R";
  const budget = 20600;

  return (
    <>
      <PageHeader eyebrow="Finance" title="Money, but peaceful" subtitle="Currency, income, spend, budgets, expenses, and savings are editable in place." theme={theme} action={<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="rounded-2xl border border-[#E2E6ED] bg-white px-4 py-3 text-sm font-semibold outline-none">{["ZAR", "USD", "GBP", "EUR"].map((item) => <option key={item}>{item}</option>)}</select>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="!p-0">
            <div className="rounded-[24px] p-7 text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, #3D5B73)` }}>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Monthly Overview</p>
              <p className="font-display text-6xl">{symbol}{spent.toLocaleString()}</p>
              <p className="text-sm opacity-90">of {symbol}{budget.toLocaleString()} budget</p>
              <div className="mt-4 h-2 rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} /></div>
            </div>
          </Card>
          <Segment labels={["Overview", "Budget", "Expenses", "Savings"] as const} active={tab} onChange={setTab} theme={theme} />
          {tab === "Overview" && <FinanceOverview theme={theme} symbol={symbol} income={income} spent={spent} />}
          {tab === "Budget" && <BudgetPanel theme={theme} symbol={symbol} />}
          {tab === "Expenses" && <ExpensePanel theme={theme} symbol={symbol} setSpent={setSpent} />}
          {tab === "Savings" && <SavingsPanel theme={theme} symbol={symbol} />}
        </div>
        <Card>
          <Label>Quick Edit</Label>
          <label className="mb-3 block text-xs font-semibold text-[#9BA5B5]">Income</label>
          <input type="number" value={income} onChange={(event) => setIncome(Number(event.target.value))} className="mb-4 w-full rounded-2xl border border-[#E2E6ED] px-4 py-3 outline-none" />
          <label className="mb-3 block text-xs font-semibold text-[#9BA5B5]">Spent this month</label>
          <input type="number" value={spent} onChange={(event) => setSpent(Number(event.target.value))} className="mb-4 w-full rounded-2xl border border-[#E2E6ED] px-4 py-3 outline-none" />
          <Button theme={theme} className="w-full">Update snapshot</Button>
        </Card>
      </div>
    </>
  );
}

function FinanceOverview({ theme, symbol, income, spent }: { theme: (typeof themes)[ThemeName]; symbol: string; income: number; spent: number }) {
  return <div className="grid gap-4 md:grid-cols-3">{[[`${symbol}${income.toLocaleString()}`, "Income"], [`${symbol}${spent.toLocaleString()}`, "Spent"], [`${symbol}${(income - spent).toLocaleString()}`, "Remaining"]].map(([a, b]) => <Card key={b}><p className="font-display text-3xl" style={{ color: theme.deep }}>{a}</p><p className="text-xs text-[#9BA5B5]">{b}</p></Card>)}</div>;
}

function BudgetPanel({ theme, symbol }: { theme: (typeof themes)[ThemeName]; symbol: string }) {
  return <div className="space-y-3">{[["Housing", 8500, 8500, theme.primary], ["Food", 2340, 3000, "#D4848A"], ["Transport", 980, 1500, "#C9A96E"], ["Entertainment", 1540, 1200, "#D4848A"]].map(([label, actual, budget, color]) => <Meter key={label as string} theme={theme} label={label as string} sub={`${symbol}${actual} / ${symbol}${budget}`} value={Math.min(100, Number(actual) / Number(budget) * 100)} color={color as string} />)}</div>;
}

function ExpensePanel({ theme, symbol, setSpent }: { theme: (typeof themes)[ThemeName]; symbol: string; setSpent: React.Dispatch<React.SetStateAction<number>> }) {
  const [amount, setAmount] = useState(120);
  return <Card><Label>Add Expense</Label><input value={amount} onChange={(event) => setAmount(Number(event.target.value))} type="number" className="mb-3 w-full rounded-2xl border border-[#E2E6ED] px-4 py-3 outline-none" /><Button theme={theme} onClick={() => setSpent((value) => value + amount)}>Add {symbol}{amount}</Button></Card>;
}

function SavingsPanel({ theme, symbol }: { theme: (typeof themes)[ThemeName]; symbol: string }) {
  return <div className="grid gap-4 md:grid-cols-2">{[["Emergency Fund", 68, `${symbol}20,400 / ${symbol}30,000`], ["Giving Goal", 44, `${symbol}2,200 / ${symbol}5,000`]].map(([label, value, sub]) => <Meter key={label as string} theme={theme} label={label as string} value={value as number} sub={sub as string} />)}</div>;
}

function Gym({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [tab, setTab] = useState<GymTab>("Workouts");
  const [selectedWorkout, setSelectedWorkout] = useState("Leg Day");
  return (
    <>
      <PageHeader eyebrow="Gym Planner" title="Train with structure, not chaos" subtitle="Workout tabs, builder, progress, and logs are clickable workspaces now." theme={theme} action={<Button theme={theme}>Start workout</Button>} />
      <div className="mb-5 max-w-2xl"><Segment labels={["Workouts", "Builder", "Progress", "Log"] as const} active={tab} onChange={setTab} theme={theme} /></div>
      {tab === "Workouts" && <WorkoutPanel theme={theme} selected={selectedWorkout} setSelected={setSelectedWorkout} />}
      {tab === "Builder" && <WorkoutBuilder theme={theme} />}
      {tab === "Progress" && <WorkoutProgress theme={theme} />}
      {tab === "Log" && <WorkoutLog theme={theme} />}
    </>
  );
}

function WorkoutPanel({ theme, selected, setSelected }: { theme: (typeof themes)[ThemeName]; selected: string; setSelected: (value: string) => void }) {
  return <div className="grid gap-5 xl:grid-cols-[420px_1fr]"><Card><Label>Workout Type</Label><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{["Full Body", "Upper Body", "Lower Body", "Push Day", "Pull Day", "Leg Day", "Cardio", "Core", "Mobility", "Recovery"].map((type) => <button key={type} onClick={() => setSelected(type)} className="flex items-center gap-3 rounded-2xl border-2 p-4 text-left" style={{ borderColor: selected === type ? "#D4848A" : "#E2E6ED", background: selected === type ? "#F7E8E8" : "#fff" }}><Dumbbell size={18} color={theme.primary} /><span className="text-sm font-semibold" style={{ color: theme.deep }}>{type}</span></button>)}</div></Card><Card><Label>Today&apos;s Plan</Label><h3 className="font-display text-4xl" style={{ color: theme.deep }}>{selected}</h3><p className="mb-4 text-sm text-[#5A6478]">6 exercises · approximately 65 minutes</p>{["Barbell Back Squat - 4x8-10", "Romanian Deadlift - 3x10-12", "Leg Press - 3x12-15", "Walking Lunges - 3x12 each", "Standing Calf Raise - 4x15"].map((exercise) => <div key={exercise} className="mb-2 rounded-2xl bg-[#F7F8FA] p-4 text-sm font-semibold" style={{ color: theme.deep }}>{exercise}</div>)}</Card></div>;
}

function WorkoutBuilder({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [exercises, setExercises] = useState(["Hip Thrust", "Goblet Squat"]);
  return <Card><Label>Custom Builder</Label><div className="mb-4 grid gap-3 md:grid-cols-2">{exercises.map((exercise) => <input key={exercise} defaultValue={exercise} className="rounded-2xl border border-[#E2E6ED] px-4 py-3 outline-none" />)}</div><Button theme={theme} onClick={() => setExercises((items) => [...items, "New Exercise"])}><Plus className="mr-2 inline" size={16} /> Add exercise</Button></Card>;
}

function WorkoutProgress({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return <div className="grid gap-4 md:grid-cols-3">{[["3", "Workouts this week"], ["42", "Sets completed"], ["2", "Personal records"]].map(([a, b]) => <Card key={b}><p className="font-display text-5xl" style={{ color: theme.deep }}>{a}</p><p className="text-sm text-[#9BA5B5]">{b}</p></Card>)}</div>;
}

function WorkoutLog({ theme }: { theme: (typeof themes)[ThemeName] }) {
  return <Card><Label>Recent Logs</Label>{["Leg Day - 65 min - 12,450kg volume", "Push Day - 52 min - 8,200kg volume", "Mobility - 28 min - recovery"].map((log) => <div key={log} className="mb-3 rounded-2xl bg-[#F7F8FA] p-4 text-sm font-semibold" style={{ color: theme.deep }}>{log}</div>)}</Card>;
}

function HabitManager({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [habits, setHabits] = useState(["Drink 2L Water", "Read 30 Minutes", "Morning Prayer", "Gym Workout", "Evening Journal"]);
  return (
    <>
      <PageHeader eyebrow="Habits" title="Small promises, visible progress" subtitle="Tap day cells, add habits, and watch weekly completion respond." theme={theme} action={<Button theme={theme} onClick={() => setHabits((items) => [...items, "New Habit"])}><Plus className="mr-2 inline" size={16} /> Add habit</Button>} />
      <div className="grid gap-4">
        {habits.map((habit, index) => <HabitRow key={`${habit}-${index}`} title={habit} color={["#8AAEC8", "#C9A96E", "#9B8EC4", "#6B9A72", "#D4848A"][index % 5]} />)}
      </div>
    </>
  );
}

function HabitRow({ title, color }: { title: string; color: string }) {
  const [days, setDays] = useState([true, true, false, true, true, false, true]);
  const pct = Math.round(days.filter(Boolean).length / days.length * 100);
  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${color}22` }}><Check size={18} color={color} /></span>
          <div><p className="font-semibold text-[#1A2332]">{title}</p><p className="text-xs font-medium" style={{ color }}>{pct}% this week</p></div>
        </div>
        <div className="flex flex-1 gap-2">
          {days.map((done, index) => <button key={index} onClick={() => setDays((items) => items.map((item, i) => i === index ? !item : item))} className="flex h-10 flex-1 items-center justify-center rounded-xl" style={{ background: done ? `${color}22` : "#F2F4F7" }}>{done ? <Check size={14} color={color} /> : <span className="text-xs text-[#9BA5B5]">{"MTWTFSS"[index]}</span>}</button>)}
        </div>
      </div>
    </Card>
  );
}

function QuitHabits({ theme }: { theme: (typeof themes)[ThemeName] }) {
  const [setbacks, setSetbacks] = useState(0);
  return (
    <>
      <PageHeader eyebrow="Quit Habits" title="Breaking patterns with compassion" subtitle="Milestones, relapse logs, and progress are clickable without leaving the page." theme={theme} action={<Button theme={theme} variant="soft" onClick={() => setSetbacks((value) => value + 1)}>Log a setback</Button>} />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="text-white" style={{ background: "linear-gradient(135deg,#1A2332,#3D5B73)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Longest Streak</p>
          <p className="font-display text-7xl">87</p>
          <p className="text-blue-100">days clean</p>
          <div className="mt-5 rounded-2xl bg-white/10 p-4"><p className="text-sm">Only 3 days to the 90-day milestone.</p></div>
        </Card>
        <div className="space-y-4">
          {[["Excessive Social Media", 12, "#D4848A"], ["No Energy Drinks", 34, "#C9A96E"], ["No Alcohol", 87, "#9B8EC4"], ["No Gambling", 180, theme.primary]].map(([name, days, color]) => <Meter key={name as string} theme={theme} label={name as string} sub={`${days} days clean`} value={Math.min(100, Number(days) / 90 * 100)} color={color as string} />)}
          <Card><Label>Setback Log</Label><p className="font-display text-4xl" style={{ color: theme.deep }}>{setbacks}</p><p className="text-sm text-[#5A6478]">Logged with reset-not-quit framing.</p></Card>
        </div>
      </div>
    </>
  );
}

function Onboarding({ theme, setScreen, setThemeName }: { theme: (typeof themes)[ThemeName]; setScreen: (screen: Screen) => void; setThemeName: (theme: ThemeName) => void }) {
  const steps = ["Welcome", "Assessment", "Priorities", "Build", "Quit", "Vision", "Theme", "Dashboard"];
  const [step, setStep] = useState(0);
  const [selectedPillars, setSelectedPillars] = useState<string[]>(["Physical", "Spiritual"]);
  const progress = ((step + 1) / steps.length) * 100;
  return (
    <>
      <PageHeader eyebrow="Onboarding" title={step === 0 ? "Become 1% better every day" : steps[step]} subtitle="A desktop onboarding flow that builds a personalized dashboard without feeling like a phone prototype." theme={theme} />
      <Card className="mb-5">
        <div className="mb-4 h-2 rounded-full bg-[#F2F4F7]"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: theme.primary }} /></div>
        <div className="grid gap-2 md:grid-cols-8">{steps.map((item, index) => <button key={item} onClick={() => setStep(index)} className="rounded-2xl px-3 py-2 text-xs font-semibold" style={{ background: step === index ? theme.soft : "#F7F8FA", color: step === index ? theme.primary : "#9BA5B5" }}>{item}</button>)}</div>
      </Card>
      <Card className="min-h-[420px]">
        {step === 0 && <div><p className="font-display text-5xl" style={{ color: theme.deep }}>Welcome to The Life Edit</p><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5A6478]">Plan, reflect, train, budget, pray, connect, and grow from one calm operating system.</p></div>}
        {step === 1 && <div className="grid gap-3 md:grid-cols-2">{["Financial", "Physical", "Mental & Emotional", "Social", "Spiritual", "Personal Growth"].map((pillar, index) => <Meter key={pillar} theme={theme} label={pillar} value={[6, 8, 7, 5, 9, 7][index] * 10} />)}</div>}
        {step === 2 && <div className="grid gap-3 md:grid-cols-3">{["Financial", "Physical", "Mental", "Social", "Spiritual", "Growth"].map((pillar) => <button key={pillar} onClick={() => setSelectedPillars((items) => items.includes(pillar) ? items.filter((item) => item !== pillar) : [...items, pillar])} className="rounded-2xl p-5 text-left font-semibold" style={{ background: selectedPillars.includes(pillar) ? theme.soft : "#F7F8FA", color: selectedPillars.includes(pillar) ? theme.primary : theme.deep }}>{pillar}</button>)}</div>}
        {step === 3 && <Checklist title="Habits to build" items={["Hydration", "Reading", "Prayer", "Journaling", "Study", "Gym"]} theme={theme} />}
        {step === 4 && <Checklist title="Habits to quit" items={["Smoking", "Alcohol", "Energy Drinks", "Doom Scrolling", "Gambling", "Overspending"]} theme={theme} />}
        {step === 5 && <textarea className="min-h-72 w-full resize-none rounded-[24px] border border-[#E2E6ED] p-5 font-display text-3xl outline-none" defaultValue="One year from today, I am healthy, disciplined, financially peaceful, and spiritually grounded." />}
        {step === 6 && <div className="grid gap-4 md:grid-cols-5">{(Object.keys(themes) as ThemeName[]).map((name) => <button key={name} onClick={() => setThemeName(name)} className="rounded-[24px] p-4 text-left" style={{ background: themes[name].soft, color: themes[name].primary }}><p className="font-display text-2xl">{name}</p><div className="mt-4 h-12 rounded-2xl" style={{ background: themes[name].primary }} /></button>)}</div>}
        {step === 7 && <div><p className="font-display text-5xl" style={{ color: theme.deep }}>Your dashboard is ready.</p><p className="mt-4 text-sm text-[#5A6478]">The experience now reflects your pillars, habits, quit goals, future identity, and selected theme.</p></div>}
        <div className="mt-8 flex justify-between">
          <Button theme={theme} variant="plain" onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
          <Button theme={theme} onClick={() => step === steps.length - 1 ? setScreen("Home") : setStep((value) => value + 1)}>{step === steps.length - 1 ? "Open dashboard" : "Continue"}</Button>
        </div>
      </Card>
    </>
  );
}

function Checklist({ title, items, theme }: { title: string; items: string[]; theme: (typeof themes)[ThemeName] }) {
  const [checked, setChecked] = useState(items.slice(0, 3));
  return <div><Label>{title}</Label><div className="grid gap-3 md:grid-cols-3">{items.map((item) => <button key={item} onClick={() => setChecked((values) => values.includes(item) ? values.filter((value) => value !== item) : [...values, item])} className="rounded-2xl p-5 text-left font-semibold" style={{ background: checked.includes(item) ? theme.soft : "#F7F8FA", color: checked.includes(item) ? theme.primary : theme.deep }}>{item}</button>)}</div></div>;
}

function ThemeStudio({ themeName, setThemeName }: { themeName: ThemeName; setThemeName: (theme: ThemeName) => void }) {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Theme Studio" subtitle="The Figma-inspired theme system still updates the entire desktop UI instantly." theme={themes[themeName]} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(themes) as ThemeName[]).map((name) => (
          <button key={name} className="rounded-[28px] border-2 bg-white p-5 text-left shadow-[0_2px_14px_rgba(0,0,0,.06)] transition hover:-translate-y-0.5" style={{ borderColor: name === themeName ? themes[name].primary : "transparent" }} onClick={() => setThemeName(name)}>
            <div className="mb-4 h-36 overflow-hidden rounded-[24px] border" style={{ background: themes[name].bg, borderColor: "#E2E6ED" }}>
              <div className="m-4 rounded-[22px] bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,.06)]">
                <div className="mb-3 h-8 w-32 rounded-full" style={{ background: themes[name].soft }} />
                <div className="grid grid-cols-3 gap-2"><div className="h-12 rounded-2xl" style={{ background: themes[name].primary }} /><div className="h-12 rounded-2xl" style={{ background: themes[name].soft }} /><div className="h-12 rounded-2xl" style={{ background: themes[name].deep }} /></div>
              </div>
            </div>
            <h3 className="font-display text-3xl text-[#1A2332]">{name}</h3>
            <p className="text-sm text-[#5A6478]">{name === "Powder Blue" ? "Focused and serene" : name === "Blush Rose" ? "Warm and intentional" : name === "Sage Green" ? "Grounded and natural" : name === "Warm Cream" ? "Elegant and inspired" : "Bold and immersive"}</p>
          </button>
        ))}
      </div>
    </>
  );
}
