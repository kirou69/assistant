const CACHE_NAME = 'kiru-v1';
const ASSETS = ['./index.html', './manifest.json'];

// Install — cache assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Push notification received
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title: 'Rappel', body: 'Assistant de Kiru', icon: '🔔'};
  e.waitUntil(
    self.registration.showNotification('Assistant de Kiru — ' + data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'kiru-reminder',
      requireInteraction: true,
      actions: [{ action: 'ok', title: '✓ Compris' }]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(cs => {
    if(cs.length) return cs[0].focus();
    return clients.openWindow('./index.html');
  }));
});

// Background sync for reminders (triggered by main app)
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SCHEDULE_REMINDER') {
    // Acknowledge
    e.ports[0] && e.ports[0].postMessage({status: 'ok'});
  }
});
