import type { LifeData } from "./life-store";
import { createDemoData } from "./demo-data";

export type DemoProfile = "demo" | "guest";
export const DEMO_KEY = "life-edit-demo-v1";
export const GUEST_KEY = "life-edit-guest-v1";
export const PROFILE_KEY = "life-edit-demo-profile";
export const BANNER_KEY = "life-edit-demo-banner-dismissed";
export const RESET_KEY = "life-edit-demo-reset";
export const activeDemoProfile = (): DemoProfile => localStorage.getItem(PROFILE_KEY) === "guest" ? "guest" : "demo";
const keyFor = (profile: DemoProfile) => profile === "guest" ? GUEST_KEY : DEMO_KEY;

export function loadDemoWorkspace(base: LifeData, profile = activeDemoProfile()) {
  const raw = localStorage.getItem(keyFor(profile));
  if (raw) {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 2 || !Array.isArray(saved.tasks)) throw new Error("Local demo data could not be read. Reset Demo Data in Settings or restore a valid backup.");
    return { ...base, ...saved } as LifeData;
  }
  const data = profile === "guest" ? { ...base, name: "Guest" } : createDemoData(base);
  saveDemoWorkspace(data, profile);
  return data;
}

export function saveDemoWorkspace(data: LifeData, profile = activeDemoProfile()) {
  localStorage.setItem(keyFor(profile), JSON.stringify(data));
}

export function selectDemoProfile(profile: DemoProfile) {
  localStorage.setItem(PROFILE_KEY, profile);
}

export async function resetDemoWorkspace(base: LifeData) {
  // Clear this app's local media, never browser-wide storage or Supabase records.
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("life-edit-images");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other Life Edit tabs, then try resetting again."));
  });
  localStorage.removeItem(GUEST_KEY);
  localStorage.removeItem("life-edit-preview-v2");
  localStorage.removeItem(BANNER_KEY);
  localStorage.removeItem("life-edit-theme");
  selectDemoProfile("demo");
  const clean = { ...base, name: "Demo User" };
  saveDemoWorkspace(clean, "demo");
  localStorage.setItem(RESET_KEY, crypto.randomUUID());
  return clean;
}
