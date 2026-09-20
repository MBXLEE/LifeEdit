"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const persistenceCookie = "life-edit-auth-persistence";
const sessionMode = "session";

function parseCookies() {
  if (typeof document === "undefined") return [];
  return document.cookie.split(";").map(cookie => {
    const [name = "", ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  }).filter(cookie => cookie.name);
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${name}=${value}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function authCookieOptions(options: CookieOptions) {
  const next = { ...options, path: options.path ?? "/" };
  if (parseCookies().some(cookie => cookie.name === persistenceCookie && decodeURIComponent(cookie.value) === sessionMode)) {
    delete next.maxAge;
    delete next.expires;
  }
  return next;
}

export function setAuthPersistence(staySignedIn: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = serializeCookie(persistenceCookie, staySignedIn ? "persistent" : sessionMode, staySignedIn ? { maxAge: 60 * 60 * 24 * 400 } : {});
}

export function clearAuthPersistence() {
  if (typeof document === "undefined") return;
  document.cookie = serializeCookie(persistenceCookie, "", { maxAge: 0 });
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: false,
      cookies: {
        getAll() {
          return parseCookies();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookie(name, value, authCookieOptions(options));
          });
        }
      }
    }
  );
}
