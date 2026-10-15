export const notificationWorkerSource = String.raw`
const notificationDb = () => new Promise((resolve,reject) => {
  const request = indexedDB.open('life-edit-notifications-v2',1);
  request.onupgradeneeded = () => request.result.createObjectStore('state');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
async function notificationState(key, value) {
  const db = await notificationDb();
  try {
    return await new Promise((resolve,reject) => {
      const tx = db.transaction('state',value === undefined ? 'readonly' : 'readwrite');
      const store = tx.objectStore('state');
      const result = value === undefined ? store.get(key) : store.put(value,key);
      tx.oncomplete = () => resolve(result.result);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function presentReminder(item, local = false) {
  if (self.Notification.permission !== 'granted' || !item || item.at > Date.now() || item.expiresAt <= Date.now()) return;
  const state = await notificationState('preferences');
  if (state && (!state.enabled || !state.categories[item.category])) return;
  if (local && state?.ids && !state.ids.includes(item.id)) return;
  const db = await notificationDb();
  // Claim inside one read/write transaction, shared by all tabs and push events.
  const claimed = await new Promise((resolve,reject) => {
    const tx = db.transaction('state','readwrite'), store = tx.objectStore('state');
    let ok = false;
    const get = store.get('delivered');
    get.onsuccess = () => {
      const ids = get.result || [];
      if (!ids.includes(item.id)) { store.put([...ids,item.id].slice(-1000),'delivered'); ok = true; }
    };
    tx.oncomplete = () => resolve(ok);
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
  if (!claimed) return;
  try {
    await self.registration.showNotification(item.title,{body:item.body,tag:item.id,icon:'/icon-192.png',badge:'/maskable-icon-512.png',data:{url:item.url,id:item.id,category:item.category,item},renotify:false});
  } catch (error) {
    // Allow a later attempt when the browser temporarily cannot show a reminder.
    const ids = await notificationState('delivered') || [];
    await notificationState('delivered',ids.filter(id => id !== item.id));
    throw error;
  }
}
self.addEventListener('message',event => {
  if (event.data?.type === 'NOTIFICATION_PREFERENCES') event.waitUntil((async () => {
    await notificationState('preferences',{...event.data.settings,ids:event.data.ids});
    const valid = new Set([...event.data.ids,...(event.data.keepIds || [])]);
    const visible = await self.registration.getNotifications();
    visible.filter(n => n.data?.id && (!event.data.settings.enabled || !valid.has(n.data.id))).forEach(n => n.close());
  })());
  if (event.data?.type === 'SHOW_REMINDER') event.waitUntil(presentReminder(event.data.item,true).then(() => event.ports?.[0]?.postMessage({ok:true}),() => event.ports?.[0]?.postMessage({ok:false})));
});
self.addEventListener('push',event => {
  event.waitUntil((async () => {
    if (!event.data) return;
    const payload = event.data.json();
    const response = await fetch('/api/notifications/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
    if (response.ok) await presentReminder(await response.json());
  })());
});
self.addEventListener('notificationclick',event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || '/settings',self.location.origin);
    if (target.origin !== self.location.origin) return;
    const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const client = windows.find(c => new URL(c.url).origin === target.origin);
    if (client) { await client.navigate(target.href); return client.focus(); }
    return self.clients.openWindow(target.href);
  })());
});
`;
