"use client";
import { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { isDemoMode } from "@/lib/app-mode";
import { BANNER_KEY, resetDemoWorkspace, selectDemoProfile, type DemoProfile } from "@/lib/demo-storage";
import { emptyData } from "@/lib/life-store";
import { Button, Modal } from "./workspace-ui";
import { InstallAppButton } from "./pwa-install";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => { if (isDemoMode) { try { setDismissed(localStorage.getItem(BANNER_KEY) === "true"); } catch { setDismissed(false); } } }, []);
  if (!isDemoMode || dismissed) return null;
  return <aside className="le-demo-banner" aria-label="Demo mode notice"><div><strong>Demo Mode Active</strong><p>Data is stored locally until a backend is connected.</p></div><button className="le-icon" title="Dismiss demo notice" aria-label="Dismiss demo notice" onClick={() => { setDismissed(true); try { localStorage.setItem(BANNER_KEY, "true"); } catch { /* Dismiss for this visit. */ } }}><X size={16}/></button></aside>;
}

export function DemoLogin() {
  const [error, setError] = useState("");
  function enter(profile: DemoProfile) {
    try { selectDemoProfile(profile); window.location.assign("/dashboard"); }
    catch { setError("Enable browser storage to keep your local workspace."); }
  }
  if (!isDemoMode) return null;
  return <div className="le-demo-login"><p className="le-muted">No account or backend connection needed.</p><Button onClick={() => enter("demo")}>Demo User Login</Button><Button secondary onClick={() => enter("guest")}>Continue As Guest</Button><InstallAppButton/>{error && <p role="alert">{error}</p>}</div>;
}

export function ResetDemoData() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!isDemoMode) return null;
  async function reset() {
    setBusy(true); setError("");
    try { await resetDemoWorkspace(emptyData()); window.location.replace("/onboarding"); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not reset local data."); setBusy(false); }
  }
  return <section className="le-demo-settings"><h2>Demo workspace</h2><p className="le-muted">Reset removes demo and guest records and local uploads from this browser. It does not change Supabase data.</p><Button secondary onClick={() => setOpen(true)}><RotateCcw size={16}/>Reset Demo Data</Button>{open && <Modal title="Reset demo data?" close={() => { if (!busy) setOpen(false); }}><p className="le-muted my-5">All local test records and uploaded images will be removed. Onboarding will restart. This cannot be undone.</p>{error && <p role="alert">{error}</p>}<div className="le-inline"><Button secondary disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy} onClick={() => void reset()}>{busy ? "Resetting..." : "Reset and restart onboarding"}</Button></div></Modal>}</section>;
}
