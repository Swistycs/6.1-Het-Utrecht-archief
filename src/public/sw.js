const VERSION = 'oudegracht-v1';
const SHELL = `${VERSION}-shell`;
const MEDIA = `${VERSION}-media`;
const TILES = `${VERSION}-tiles`;

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

async function rangeFromCache(request) {
  const cache = await caches.open(MEDIA);
  const cached = await cache.match(request.url);
  if (!cached) return fetch(request);
  const blob = await cached.blob();
  const size = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (!m) return new Response(blob, { status: 200, headers: { 'Content-Type': cached.headers.get('Content-Type') || 'video/mp4', 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
  let start = m[1] === '' ? size - Number(m[2]) : Number(m[1]);
  let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(end, size - 1);
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(request, TILES));
    return;
  }
  if (url.origin !== self.location.origin || url.pathname.includes('/cms/')) return;

  if (url.pathname.includes('/assets/video/')) {
    event.respondWith(rangeFromCache(request));
    return;
  }
  if (url.pathname.includes('/uploads/')) {
    event.respondWith(cacheFirst(request, MEDIA));
    return;
  }
  event.respondWith(networkFirst(request));
});
