const CACHE = "intg-employee-static-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.includes("/assets/")) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(event.request)) || fetch(event.request).then((response) => { if (response.ok) cache.put(event.request, response.clone()); return response; })));
});
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch {}
  if (!payload.title) return;
  event.waitUntil(Promise.all([
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "./icon.svg",
      badge: "./icon.svg",
      data: { bookingID: payload.booking_id, url: payload.url || "./" },
    }),
    self.registration.setAppBadge?.(),
  ]));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    await self.registration.clearAppBadge?.();
    const target = new URL(event.notification.data?.url || "./", self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      const navigated = await existing.navigate(target);
      if (navigated) {
        await navigated.focus();
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
