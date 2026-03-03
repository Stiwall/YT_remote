/**
 * YT Remote - Service Worker
 * Estrategia: Cache-First para estáticos, Network-First para APIs
 * Versión: 1.0.0
 */

const CACHE_NAME = 'yt-remote-v1.0.0';
const STATIC_CACHE = 'yt-remote-static-v1.0.0';
const IMAGE_CACHE = 'yt-remote-images-v1.0.0';

// Recursos estáticos principales (cacheados en install)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png'
];

// URLs externas críticas para el funcionamiento
const EXTERNAL_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js',
  'https://www.youtube.com/iframe_api'
];

// Instalación: Precachear recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando recursos estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Recursos estáticos cacheados');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Error al cachear:', err);
      })
  );
});

// Activación: Limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('yt-remote-') && 
                     name !== STATIC_CACHE && 
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Eliminando cache antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Fetch: Estrategia de caché inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones no GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Estrategia 1: Cache-First para recursos estáticos locales
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estrategia 2: Stale-While-Revalidate para imágenes de YouTube
  if (isYouTubeImage(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }
  
  // Estrategia 3: Network-First para APIs externas (PeerJS, YouTube)
  if (isExternalAPI(url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estrategia 4: Network with Cache Fallback para todo lo demás
  event.respondWith(networkWithCacheFallback(request));
});

// ═══════════════════════════════════════════════════════
// ESTRATEGIAS DE CACHÉ
// ═══════════════════════════════════════════════════════

// Cache-First: Ideal para recursos estáticos que no cambian
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refrescar en segundo plano (background refresh)
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    
    return cached;
  }
  
  // Si no está en caché, buscar en red y cachear
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Error fetch:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Stale-While-Revalidate: Muestra caché inmediatamente, actualiza en background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || fetchPromise;
}

// Network-First: Intenta red primero, fallback a caché
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Fallback a caché para:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network with Cache Fallback: Similar a network-first pero más permisivo
async function networkWithCacheFallback(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Respuesta offline genérica
    return new Response(
      JSON.stringify({ 
        error: 'offline',
        message: 'Sin conexión a internet. Algunas funciones pueden no estar disponibles.'
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function isStaticAsset(url) {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  const isLocal = url.origin === self.location.origin;
  const hasStaticExt = staticExtensions.some(ext => url.pathname.endsWith(ext));
  return isLocal && hasStaticExt;
}

function isYouTubeImage(url) {
  return url.hostname.includes('ytimg.com') || 
         url.hostname.includes('youtube.com') && url.pathname.includes('/vi/');
}

function isExternalAPI(url) {
  return url.hostname.includes('peerjs.com') ||
         url.hostname.includes('cloudflare.com') ||
         url.hostname.includes('googleapis.com') ||
         url.hostname.includes('youtube.com') && url.pathname.includes('/iframe_api');
}

// ═══════════════════════════════════════════════════════
// MENSAJES DESDE LA APP
// ═══════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// ═══════════════════════════════════════════════════════
// SINCRONIZACIÓN EN BACKGROUND
// ═══════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue());
  }
});

async function syncQueue() {
  // Lógica de sincronización en background si es necesaria
  console.log('[SW] Sincronización en background');
}

// ═══════════════════════════════════════════════════════
// NOTIFICACIONES PUSH (preparado para futuro)
// ═══════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-maskable.png',
        tag: data.tag || 'yt-remote',
        requireInteraction: false,
        actions: data.actions || []
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker cargado');
