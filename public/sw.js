// Service worker só para notificações push (sem cache: nunca serve versão antiga do app).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { /* payload inválido: usa o padrão */ }
  event.waitUntil(self.registration.showNotification(d.title || 'Entre o Céu e Eu', {
    body: d.body || 'Um novo céu espera por você.',
    icon: '/icon.svg', badge: '/icon.svg', tag: 'lembrete-diario',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('/');
  }));
});
