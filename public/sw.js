/**
 * ==============================================================================
 * SERVICE WORKER: WAKA III MMD DARUSSALAMAH (WEB PUSH NATIVE)
 * ==============================================================================
 * Menangani notifikasi sistem push browser secara mandiri tanpa pihak ketiga.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Event saat menerima Web Push Notification dari Server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'WAKA III MMD Darussalamah',
        message: event.data.text(),
      };
    }
  }

  const title = data.title || 'WAKA III MMD Darussalamah';
  const options = {
    body: data.message || data.body || 'Pemberitahuan baru dari portal WAKA III MMD.',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'waka3-notification-' + Date.now(),
    renotify: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Buka Halaman' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Event saat pengguna mengeklik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika tab sudah terbuka di browser, arahkan dan fokus ke tab tersebut
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Jika belum ada tab yang terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
