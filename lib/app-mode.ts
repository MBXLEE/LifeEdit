// Resolved once by next.config.mjs so the browser and middleware use the same mode.
export const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE === "DEMO" ? "DEMO" : "PRODUCTION";
export const isDemoMode = APP_MODE === "DEMO";
