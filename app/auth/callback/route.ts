import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/app-mode";
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (isDemoMode) return NextResponse.redirect(new URL("/dashboard", url.origin));
  const code = url.searchParams.get("code");
  if (code) {
    const db = await createClient();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      if (url.searchParams.get("next") === "/reset-password") return NextResponse.redirect(new URL("/reset-password", url.origin));
      const { data: profile } = await db.from("profiles").select("onboarding_completed").eq("id", data.user.id).maybeSingle();
      return NextResponse.redirect(new URL(profile?.onboarding_completed ? "/dashboard" : "/onboarding", url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
}
