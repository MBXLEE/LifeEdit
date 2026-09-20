"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { advanceFocus, extraDefaults, type ExtraData, type Exercise } from "@/lib/life-domain";
import { refinementDefaults, type RefinementData, type Classification } from "@/lib/refinements";
import { defaultNotificationSettings, type NotificationSettings } from "@/lib/notifications";

export const pillars = ["Financial", "Physical", "Mental & Emotional", "Social", "Spiritual", "Personal Growth"];
export const themeNames = ["Ocean", "Blush", "Sage", "Cream", "Midnight"] as const;
export type Theme = typeof themeNames[number];
export const uid = () => crypto.randomUUID();
export function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
export const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export type Goal = { id: string; title: string; horizon: string; parent: string; pillars: string[]; progress: number; archived: boolean; due: string; notes: string };
export type Habit = { id: string; name: string; direction: "build" | "quit"; dates: string[]; start: string; setbacks: { date: string; note: string }[] };
export type Task = { id: string; title: string; date: string; time: string; minutes: number; pillar: string; done: boolean };
export type Workout = { id: string; name: string; category: string; warmup: string; cooldown?: string; notes?: string; archived?: boolean; exercises: (Omit<Exercise, "category" | "seconds" | "notes"> & Partial<Pick<Exercise, "category" | "seconds" | "notes">>)[] };
export type LifeData = ExtraData & RefinementData & {
  version: 2; name: string; theme: Theme; onboarded: boolean;
  assessment: Record<string, number>; areas: string[]; priorities: string[];
  identity: string; vision: string; mission: string; lifestyle: string;
  goals: Goal[]; habits: Habit[]; tasks: Task[];
  templates: { id: string; name: string; pillar: string; prompts: string[] }[];
  journals: { id: string; title: string; template: string; pillar: string; body: string; date: string }[];
  currencies: { code: string; name: string; symbol: string }[]; currency: string;
  categories: string[]; budgets: { id: string; category: string; amount: number; currency: string; month: string }[];
  transactions: { id: string; title: string; category: string; amount: number; type: string; classification?: Classification | ""; currency: string; date: string }[];
  workoutTypes: string[]; workouts: Workout[]; workoutLogs: { id: string; name: string; date: string; minutes: number; volume: number; exercises?: Workout["exercises"]; notes?: string }[];
  focusTypes: string[]; focus: { id: string; name: string; seconds: number; date: string }[];
  board: { id: string; title: string; url: string; category?: string; notes?: string; goalId?: string }[];
  notificationSettings: NotificationSettings;
};
export function emptyData(): LifeData {
  return { ...extraDefaults(), ...refinementDefaults(), version: 2, name: "", theme: "Ocean", onboarded: false, assessment: {}, areas: [...pillars], priorities: [], identity: "", vision: "", mission: "", lifestyle: "", goals: [], habits: [], tasks: [],
    templates: pillars.map((pillar, i) => ({ id: `pillar-${i}`, name: pillar, pillar, prompts: [
      ["What financial decision did I make today?", "Did I stay within budget?"],
      ["How did I care for my body today?", "What health goal did I work towards?"],
      ["How am I feeling today?", "What challenged me today?"],
      ["Who did I connect with today?", "How can I strengthen important relationships?"],
      ["What did I learn during reflection today?", "What am I praying for?"],
      ["What skill am I improving?", "What progress did I make?"]
    ][i] })), journals: [], currencies: [{ code: "ZAR", name: "South African rand", symbol: "R" }, { code: "USD", name: "US dollar", symbol: "$" }, { code: "GBP", name: "British pound", symbol: "£" }, { code: "EUR", name: "Euro", symbol: "€" }], currency: "ZAR", categories: ["Housing", "Utilities", "Food", "Transport", "Entertainment", "Savings", "Investments", "Health", "Giving"], budgets: [], transactions: [], workoutTypes: ["Full Body", "Upper Body", "Lower Body", "Push", "Pull", "Legs", "Cardio", "Core", "Mobility", "Recovery"], workouts: [], workoutLogs: [], focusTypes: ["Study", "Deep Work", "Reading", "Work"], focus: [], board: [], notificationSettings: defaultNotificationSettings() };
}
function withDefaults(raw: Partial<LifeData>): LifeData {
  const base = emptyData();
  const notificationSettings = raw.notificationSettings ? {
    ...base.notificationSettings,
    ...raw.notificationSettings,
    categories: { ...base.notificationSettings.categories, ...raw.notificationSettings.categories },
    reminderTimes: { ...base.notificationSettings.reminderTimes, ...raw.notificationSettings.reminderTimes }
  } : base.notificationSettings;
  return { ...base, ...raw, notificationSettings };
}
type Store = { data: LifeData; update: (fn: (data: LifeData) => LifeData) => void; ready: boolean; status: string; error: string; retry: () => void; account: boolean; back: () => void; undo: () => void; undoLabel: string; dismissUndo: () => void; offerUndo: (label: string, restore: (data: LifeData) => LifeData) => void };
const Context = createContext<Store | null>(null);
export function LifeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const trail = useRef<string[]>([]);
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) { trail.current.push(previous.current); previous.current = pathname; }
  }, [pathname]);
  function back() {
    const destination = trail.current.pop() ?? "/dashboard";
    previous.current = destination;
    router.push(destination as Route);
  }
  const [data, setData] = useState(emptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const owner = useRef("");
  const revision = useRef(0);
  const dirty = useRef(false);
  const latest = useRef(data);
  const busy = useRef(false);
  const [undoLabel, setUndoLabel] = useState("");
  const undoAction = useRef<((data: LifeData) => LifeData) | null>(null);
  useEffect(() => {
    if (ready) return;
    let alive = true;
    async function load() {
      try {
        if (configured() && ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"].includes(window.location.pathname)) return;
        if (configured()) {
          const db = createClient();
          const { data: auth, error: authError } = await db.auth.getUser();
          if (authError || !auth.user) { window.location.replace("/login"); return; }
          owner.current = auth.user.id;
          const { data: row, error: readError } = await db.from("life_workspaces").select("data,revision").eq("user_id", auth.user.id).maybeSingle();
          if (readError) throw readError;
          const loaded = withDefaults({ ...(row?.data ?? {}), name: row?.data?.name ?? auth.user.user_metadata?.name ?? "" });
          if (alive) { revision.current = row?.revision ?? 0; latest.current = loaded; setData(loaded); setAccount(true); setReady(true); setStatus("Saved to your account"); }
        } else {
          const raw = localStorage.getItem("life-edit-preview-v2");
          const loaded = raw ? withDefaults(JSON.parse(raw)) : emptyData();
          if (alive) { latest.current = loaded; setData(loaded); setReady(true); setStatus("Saved on this device"); }
        }
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Unable to load your workspace. Please retry."); }
    }
    void load();
    return () => { alive = false; };
  }, [attempt, pathname]);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = data.theme.toLowerCase();
    if (!dirty.current) return;
    if (!account) {
      try { localStorage.setItem("life-edit-preview-v2", JSON.stringify(data)); dirty.current = false; setStatus("Saved on this device"); setError(""); }
      catch { setError("Device storage is full or unavailable. Export your data before leaving."); }
      return;
    }
    const timer = window.setInterval(async () => {
      if (busy.current || !dirty.current) return;
      busy.current = true;
      const snapshot = latest.current;
      try {
        const { data: next, error: saveError } = await createClient().rpc("save_life_workspace", { payload: snapshot, expected_revision: revision.current });
        if (saveError) throw saveError;
        revision.current = next;
        if (latest.current === snapshot) { dirty.current = false; setStatus("Saved to your account"); }
        setError("");
      } catch { setError("Changes could not sync. Keep this page open and retry. Another open session may have newer changes."); setStatus("Unsaved changes"); }
      finally { busy.current = false; }
    }, 800);
    return () => clearInterval(timer);
  }, [data, ready, account]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const update = useCallback((fn: (data: LifeData) => LifeData) => {
    const before = latest.current;
    const next = fn(before);
    const removed: { key: keyof LifeData; rows: { id: string }[] }[] = [];
    for (const key of Object.keys(before) as (keyof LifeData)[]) {
      const a = before[key], b = next[key];
      if (Array.isArray(a) && Array.isArray(b)) {
        const rows = (a as unknown[]).filter((row): row is { id: string } => typeof row === "object" && row !== null && "id" in row && !b.some(other => typeof other === "object" && other !== null && "id" in other && other.id === row.id));
        if (rows.length) removed.push({ key, rows });
      }
    }
    const cleared = (["identity", "vision", "mission", "lifestyle"] as const).filter(key => before[key] && !next[key]);
    if (removed.length || cleared.length) {
      undoAction.current = current => {
        const restored = { ...current };
        for (const { key, rows } of removed) {
          const existing = current[key] as { id: string }[];
          Object.assign(restored, { [key]: [...existing, ...rows.filter(row => !existing.some(item => item.id === row.id))] });
        }
        for (const key of cleared) if (!restored[key]) restored[key] = before[key];
        return restored;
      };
      setUndoLabel("Deleted. You can undo this change.");
    }
    latest.current = next; dirty.current = true; setData(next); setStatus("Saving...");
  }, []);
  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const plan = latest.current.focusPlan;
      if (!plan?.running || !plan.endsAt || Date.now() < plan.endsAt) return;
      const advanced = advanceFocus(plan, Date.now());
      update(d => ({ ...d, focusPlan: advanced.plan, focus: [...d.focus, ...advanced.logs.filter(log => !d.focus.some(f => f.id === log.id))] }));
    };
    tick(); const timer = window.setInterval(tick, 500); return () => clearInterval(timer);
  }, [ready, update]);
  function undo() { if (undoAction.current) update(undoAction.current); undoAction.current = null; setUndoLabel(""); }
  return <Context.Provider value={{ data, update, ready, status, error, account, back, undo, undoLabel, offerUndo: (label, restore) => { undoAction.current = restore; setUndoLabel(label); }, dismissUndo: () => { undoAction.current = null; setUndoLabel(""); }, retry: () => { if (!ready) { setError(""); setAttempt(n => n + 1); } else { setData({ ...latest.current }); } } }}>{children}</Context.Provider>;
}
export function useLife() { const value = useContext(Context); if (!value) throw new Error("LifeProvider required"); return value; }

