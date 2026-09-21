const assert = require('node:assert/strict');
(async () => {
  const { resolveAppMode } = await import('../next.config.mjs');
  assert.equal(resolveAppMode({}), 'DEMO');
  assert.equal(resolveAppMode({ NEXT_PUBLIC_SUPABASE_URL:'https://example.test' }), 'DEMO');
  assert.equal(resolveAppMode({ NEXT_PUBLIC_SUPABASE_URL:'https://example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY:'key' }), 'PRODUCTION');
  assert.equal(resolveAppMode({ APP_MODE:'DEMO', NEXT_PUBLIC_SUPABASE_URL:'https://example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY:'key' }), 'DEMO');
  assert.equal(resolveAppMode({ APP_MODE:'PRODUCTION' }), 'PRODUCTION');
  assert.throws(() => resolveAppMode({ APP_MODE:'invalid' }), /APP_MODE/);
  console.log('PASS: automatic defaults, explicit mode overrides, production fail-closed selection, invalid flag rejection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
