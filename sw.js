/* ═══════════════════════════════════════════════════════
   YT Remote - Service Worker
   Versión: 1.0.0
   ═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'ytremote-v1';
const CACHE_STATIC = 'ytremote-static-v1';

// Archivos que se cachean al instalar (app shell)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png'
];

// URLs externas que también cacheamos
const EXTERNAL_CACHE = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js'
];

/* ── INSTALL ── */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v1...');
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[SW] Cacheando archivos estáticos');
      // Cachear archivos locales (crítico)
      return cache.addAll(STATIC_FILES).then(() => {
        // Cachear externos de forma opcional (no falla si no puede)
        return Promise.allSettled(
          EXTERNAL_CACHE.map(url => cache.add(url).catch(() => {}))
        );
      });
    }).then(() => {
      console.log('[SW] Instalación completa');
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Activo y controlando');
      return self.clients.claim();
    })
  );

  // Notificar a los clientes que hay una actualización
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'UPDATE_AVAILABLE' });
    });
  });
});

/* ── FETCH ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no son GET
  if (request.method !== 'GET') return;

  // Ignorar la YouTube IFrame API (siempre necesita red)
  if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') return;

  // Ignorar PeerJS signaling (siempre necesita red)
  if (url.hostname.includes('peerjs.com')) return;

  // Ignorar noembed (siempre necesita red)
  if (url.hostname === 'noembed.com') return;

  // Ignorar thumbnails de YouTube
  if (url.hostname === 'img.youtube.com') return;

  // Estrategia: Cache First para estáticos, Network First para el resto
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

/* ── ESTRATEGIAS ── */

// Cache First: usa caché si existe, si no va a red y cachea
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Recurso no disponible offline', { status: 503 });
  }
}

// Network First: intenta red primero, cae a caché si falla
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback: devolver index.html para navegación
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }

    return new Response('Sin conexión', { status: 503 });
  }
}

function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json' ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  );
}

/* ── MENSAJES ── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting solicitado');
    self.skipWaiting();
  }
});
