const VERSION = 'oudegracht-v3';
const SHELL = `${VERSION}-shell`;
const MEDIA = 'oudegracht-media';
const TILES = 'oudegracht-tiles';

const SHELL_FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/player.js',
  'js/map.js',
  'js/points.js',
  'js/popup.js',
  'js/idle.js',
  'js/audio.js',
  'vendor/leaflet/leaflet.js',
  'vendor/leaflet/leaflet.css',
  'assets/img/logo-hua.svg',
  'api/content.php',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL, MEDIA, TILES];
    for (const key of await caches.keys()) {
      if (!keep.includes(key)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'precache-media') return;
  event.waitUntil((async () => {
    const cache = await caches.open(MEDIA);
    for (const url of event.data.urls) {
      if (await cache.match(url)) continue;
      try {
        const res = await fetch(url);
        if (res.ok && res.status === 200) await cache.put(url, res);
      } catch {
        continue;
      }
    }
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  let res = null;
  try {
    res = await fetch(request);
    if (res.ok) {
      cache.put(request, res.clone());
      return res;
    }
  } catch {
    res = null;
  }
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (res) return res;
  throw new Error('offline en niet in de cache');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.includes('/cms/')) return;
  if (url.pathname.includes('/assets/kaart/')) {
    event.respondWith(cacheFirst(request, TILES));
    return;
  }

  if (url.pathname.includes('/assets/video/')) return;
  if (url.pathname.includes('/uploads/')) {
    event.respondWith(cacheFirst(request, MEDIA));
    return;
  }
  event.respondWith(networkFirst(request));
});
