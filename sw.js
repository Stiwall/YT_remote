// ═══════════════════════════════════════════════════════
//  YT Remote — Service Worker
// ═══════════════════════════════════════════════════════
const CACHE_NAME  = 'ytremote-v4';
const CACHE_URLS  = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js'
];

// Instalar — cachear recursos esenciales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activar — limpiar cachés viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first para assets, network first para el app
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Siempre red para APIs externas (YouTube, PeerJS, búsqueda)
  if (
    url.hostname.includes('youtube') ||
    url.hostname.includes('peerjs') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('pipedapi') ||
    url.hostname.includes('invidious') ||
    url.hostname.includes('noembed') ||
    url.hostname.includes('corsproxy')
  ) {
    return; // deja pasar sin interceptar
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          // Cachear respuestas válidas de mismo origen
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline fallback: devolver app.html para navegación
          if (e.request.mode === 'navigate') {
            return caches.match('/app.html') || caches.match('/index.html');
          }
        });
    })
  );
});

// Mensaje desde el cliente para forzar actualización
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
