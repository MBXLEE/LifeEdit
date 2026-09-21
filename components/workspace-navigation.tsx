"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, ArrowLeft, BookOpen, CalendarDays, ChartNoAxesCombined, Check, CircleDollarSign, Clock, Dumbbell, Home, LogOut, Menu, Palette, Pencil, Star, Users, X } from "lucide-react";
import { useLife } from "@/lib/life-store";
import { DemoBanner } from "./demo-controls";

export const workspaceLinks = [
  ["Home", "/dashboard", Home], ["Planner", "/planner", CalendarDays],
  ["Focus", "/focus", Clock], ["Journal", "/journal", BookOpen],
  ["Life Edit", "/life-edit", Star], ["Insights", "/insights", ChartNoAxesCombined],
  ["Finance", "/finance", CircleDollarSign], ["Gym Planner", "/fitness", Dumbbell],
  ["Relationships", "/social", Users], ["Habit Manager", "/habits", Check],
  ["Quit Habits", "/quit-habits", Archive], ["Spiritual", "/spiritual", BookOpen],
  ["Theme Studio", "/settings", Palette],
] as const;

export function profileName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return { first: words[0] || "", initials: words.length ? [words[0], ...(words.length > 1 ? [words[words.length - 1]] : [])].map(word => Array.from(word)[0]).join("").toLocaleUpperCase() : "LE" };
}

export function WorkspaceNavigation({ path, logout, children }: { path: string; logout: () => void; children: React.ReactNode }) {
  const { data, account, back, status } = useLife();
  const [compact, setCompact] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem("life-edit-sidebar"); if (saved !== null) setCompact(saved === "compact"); } catch { /* Navigation still works when storage is unavailable. */ }
  }, []);
  useEffect(() => setMobileOpen(false), [path]);
  function toggle() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen(open => !open);
      return;
    }
    const next = !(compact ?? window.matchMedia("(max-width: 1199px)").matches);
    setCompact(next);
    try { localStorage.setItem("life-edit-sidebar", next ? "compact" : "expanded"); } catch { /* Keep the choice for this visit. */ }
  }
  const current = workspaceLinks.find(link => link[1] === path)?.[0] || "Onboarding";
  return <div className="le-app" data-page={path.slice(1)} data-sidebar={compact === null ? "auto" : compact ? "compact" : "expanded"}>
    {mobileOpen && <button type="button" className="le-scrim" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`le-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="Main navigation" aria-hidden={!mobileOpen ? undefined : false}>
      <div className="le-sidebar-head"><Link href="/dashboard" className="le-brand" title="The Life Edit"><span>LE</span><div>The Life Edit<small>1% better every day</small></div></Link><button type="button" className="le-icon le-drawer-close" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}><X size={19}/></button></div>
      <nav aria-label="Main navigation">{workspaceLinks.map(([label, href, Icon], index) => <div key={href}>
        {(index === 0 || index === 6 || index === 12) && <p className="le-nav-group le-eyebrow">{index === 0 ? "Navigation" : index === 6 ? "Modules" : "Settings"}</p>}
        <Link href={href} title={label} aria-label={label} aria-current={path === href ? "page" : undefined} onClick={() => setMobileOpen(false)}><Icon size={19} /><span>{label}</span></Link>
      </div>)}</nav>
      <div className="le-sidebar-footer"><Link href="/onboarding" title="Edit life assessment"><Pencil size={18}/><span>Edit life assessment</span></Link>
        {account ? <button onClick={logout} title="Log out"><LogOut size={18}/><span>Log out</span></button> : <Link href="/login" title="Log in / Create account"><LogOut size={18}/><span>Log in / Create account</span></Link>}
        <small>{account ? "Your personal space" : "Local preview - This device only"}</small>
      </div>
    </aside>
    <div className="le-main"><header className="le-topbar">
      <div className="le-inline"><button className="le-icon le-sidebar-toggle" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} title={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen} onClick={toggle}><Menu size={20}/></button>
        {path !== "/dashboard" && <button className="le-icon" aria-label="Back" title="Back" onClick={back}><ArrowLeft size={20}/></button>}
        <nav className="le-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">The Life Edit</Link><span>{current}</span></nav>
      </div>
      <div className="le-inline"><span className="le-save-status" role="status">{status}</span><Link href="/settings" className="le-avatar" aria-label="Open profile settings">{profileName(data.name).initials}</Link></div>
    </header><DemoBanner />{children}{path === "/settings" && account && <div className="le-mobile-account"><button className="le-button le-secondary" onClick={logout}><LogOut size={18}/>Log out</button></div>}</div>
    <nav className="le-mobile-nav" aria-label="Quick navigation">{[workspaceLinks[0], workspaceLinks[1], workspaceLinks[2], workspaceLinks[4], workspaceLinks[3], workspaceLinks[5]].map(([label, href, Icon]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}><span className="le-nav-icon"><Icon size={20}/></span><span>{label}</span></Link>)}</nav>
  </div>;
}

export function ExploreModules() {
  return <section className="le-explore"><h2>Explore</h2><div>{workspaceLinks.slice(5).map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={20}/><span>{label}</span></Link>)}<Link href="/onboarding"><Pencil size={20}/><span>Life assessment</span></Link><Link href="/login"><LogOut size={20}/><span>Account</span></Link></div></section>;
}
