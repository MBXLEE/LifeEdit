"use client";
import Link from "next/link";
import { isDemoMode } from "@/lib/app-mode";
import { DemoBanner, DemoLogin } from "./demo-controls";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { createClient, setAuthPersistence } from "@/lib/supabase/client";
import { configured } from "@/lib/life-store";

function PasswordField({ label, value, onChange, autoComplete, minLength }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; minLength: number }) {
  const [visible, setVisible] = useState(false);
  return <label className="le-field">{label}<span className="le-password-wrap"><input type={visible ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete} value={value} onChange={e => onChange(e.target.value)} /><button type="button" className="le-password-toggle" aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"} onMouseDown={e => e.preventDefault()} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>;
}

export function AuthCard({ mode }: { mode: "login" | "signup" | "forgot" | "reset" }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [staySignedIn, setStaySignedIn] = useState(false);
  const title = mode === "login" ? "Welcome back." : mode === "signup" ? "Your next chapter starts here." : mode === "reset" ? "A fresh start." : "Let's get you back in.";
  useEffect(() => { if (new URLSearchParams(location.search).get("error") === "confirmation") setMessage("That sign-in link is invalid or has expired. Try logging in or request a new reset link."); }, []);
  async function handleAuth() {
    setMessage("");
    if (!configured()) { setMessage("Production account access is not configured. Connect Supabase or set APP_MODE=DEMO for local testing."); return; }
    if (mode === "reset" && password !== confirm) { setMessage("Your passwords do not match."); return; }
    setBusy(true);
    try {
      const db = createClient();
      if (mode === "login") {
        setAuthPersistence(staySignedIn);
        const { data, error } = await db.auth.signInWithPassword({ email, password }); if (error) throw error;
        const { data: profile, error: profileError } = await db.from("profiles").select("onboarding_completed").eq("id", data.user.id).maybeSingle(); if (profileError) throw profileError;
        window.location.assign(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
      } else if (mode === "signup") {
        const { data, error } = await db.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding` } }); if (error) throw error;
        if (data.session) window.location.assign("/onboarding"); else setMessage("Check your email to confirm your account and start your life edit.");
      } else if (mode === "forgot") {
        const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` }); if (error) throw error;
        setMessage("If an account exists for this address, a password reset link is on its way.");
      } else {
        const { error } = await db.auth.updateUser({ password }); if (error) throw error;
        setMessage("Password updated. You can return to your dashboard."); setPassword(""); setConfirm("");
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }
  async function google() {
    if (!configured()) { setMessage("Account access is not connected yet."); return; }
    setBusy(true);
    try { const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } }); if (error) throw error; }
    catch (e) { setMessage(e instanceof Error ? e.message : "Google sign-in could not start."); setBusy(false); }
  }
  if (isDemoMode) return <main className="le-auth"><Link href="/dashboard" className="le-auth-back"><ArrowLeft size={17}/>Back to app</Link><div className="le-auth-body"><p className="le-eyebrow">The Life Edit</p><h1>Your space to explore.</h1><DemoBanner/><DemoLogin/></div></main>;
  return <main className="le-auth"><Link href="/dashboard" className="le-auth-back"><ArrowLeft size={17} />Back</Link><div className="le-auth-body"><p className="le-eyebrow">The Life Edit</p><h1>{title}</h1><p className="le-muted">{mode === "forgot" ? "Enter your email for a password reset link." : mode === "reset" ? "Choose a new password for your account." : "A little more intention. A life that feels like you."}</p><form onSubmit={e => { e.preventDefault(); void handleAuth(); }}>
    {mode === "signup" && <label className="le-field">Your name<input value={name} required autoComplete="name" onChange={e => setName(e.target.value)} /></label>}
    {mode !== "reset" && <label className="le-field">Email address<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>}
    {mode !== "forgot" && <PasswordField label="Password" value={password} onChange={setPassword} minLength={mode === "login" ? 1 : 8} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
    {mode === "reset" && <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} minLength={8} autoComplete="new-password" />}
    {mode === "login" && <label className="le-auth-check"><input type="checkbox" checked={staySignedIn} onChange={e => setStaySignedIn(e.target.checked)} /><span><strong>Stay signed in</strong><small>Keep this secure browser connected after you close the app.</small></span></label>}
    <button disabled={busy} className="le-button w-full" type="submit">{busy ? "One moment..." : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : mode === "reset" ? "Update password" : "Send reset link"}<ArrowRight size={16} /></button></form>
    {(mode === "login" || mode === "signup") && <button className="le-button le-secondary w-full mt-3" disabled={busy} onClick={google}>Continue with Google</button>}
    {message && <p role="status" className="le-auth-message">{message}</p>}<div className="le-row mt-6"><Link href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create account" : "Log in"}</Link><Link href={mode === "reset" ? "/dashboard" : "/forgot-password"}>{mode === "reset" ? "Open dashboard" : "Forgot password?"}</Link></div></div></main>;
}
