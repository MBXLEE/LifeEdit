"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthCard({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password";
  const description =
    mode === "forgot"
      ? "Enter your email and we will send a reset link."
      : "Design your days, habits, goals, finances, fitness, and reflections in one calm system.";

  async function handleEmailAuth() {
    setMessage("");
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : "Signed in. Redirecting...");
      if (!error) window.location.href = "/dashboard";
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` }
      });
      setMessage(error ? error.message : "Check your email to confirm your account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`
    });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  async function handleGoogleAuth() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` }
    });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            LE
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          {mode !== "forgot" && (
            <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          )}
          <Button className="w-full" onClick={handleEmailAuth}>
            {mode === "login" ? "Login" : mode === "signup" ? "Sign up" : "Send reset link"}
          </Button>
          {mode !== "forgot" && (
            <Button className="w-full" variant="outline" onClick={handleGoogleAuth}>
              Continue with Google
            </Button>
          )}
          {message && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
          <div className="flex justify-between text-sm text-muted-foreground">
            {mode !== "login" ? <Link href="/login">Login</Link> : <Link href="/signup">Create account</Link>}
            <Link href="/forgot-password">Forgot password</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
