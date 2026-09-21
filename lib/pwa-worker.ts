export const workerSource = String.raw`
const SHELL = 'lifeedit-shell-' + MODE + '-' + VERSION;
const ASSETS = 'lifeedit-assets-v2';
const routes = new Set(['/dashboard','/planner','/focus','/life-edit','/journal','/insights','/finance','/fitness','/habits','/quit-habits','/social','/spiritual','/settings','/onboarding','/login']);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(['/offline.html','/icon-192.png','/icon-512.png','/apple-touch-icon.png'])));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('lifeedit-') && key !== SHELL && key !== ASSETS).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/static/') || /^\/(?:icon-|maskable-icon-|apple-touch-icon|splash-).*\.png$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSETS);
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      try {
        const response = await fetch(request);
        // Only demo shells may be reopened offline. Never cache authenticated documents.
        if (MODE === 'DEMO' && response.headers.get('X-Life-Edit-Mode') === 'DEMO' && routes.has(url.pathname) && response.ok && !response.redirected) await cache.put(url.pathname, response.clone());
        return response;
      } catch {
        const saved = MODE === 'DEMO' && routes.has(url.pathname) ? await cache.match(url.pathname) : null;
        return saved || await cache.match('/offline.html') || new Response('Connect to the internet and try again.', {status:503});
      }
    })());
  }
});
`;
