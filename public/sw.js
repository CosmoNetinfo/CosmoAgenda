const CACHE_NAME = "orbita-agent-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/icon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Esclude chiamate API e Supabase dal cache storage statico (gestite da offlineStorage / network)
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("supabase.co") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Se la rete fallisce, restituisce la cache se presente
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// ============================================================
// GESTIONE NOTIFICHE PUSH NATIVE (Stile banner WhatsApp / Promemoria)
// ============================================================

self.addEventListener("push", (event) => {
  let data = {
    title: "👾 Orbita Agent",
    body: "C'è da fare una cosa!",
    url: "/",
    icon: "/icon.svg",
    badge: "/icon.svg",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (err) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon.svg",
    badge: data.badge || "/icon.svg",
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "open", title: "Apri Agenda 🚀" }
    ],
    tag: data.tag || `orbita-task-${Date.now()}`,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
