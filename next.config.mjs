export function resolveAppMode(env) {
  const requested = env.APP_MODE?.trim().toUpperCase();
  if (requested && !["DEMO", "PRODUCTION"].includes(requested)) throw new Error("APP_MODE must be DEMO or PRODUCTION.");
  return requested || (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "PRODUCTION" : "DEMO");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: { NEXT_PUBLIC_APP_MODE: resolveAppMode(process.env), NEXT_PUBLIC_PWA_VERSION: process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()) },
  devIndicators: false,
  typedRoutes: true
};

export default nextConfig;
