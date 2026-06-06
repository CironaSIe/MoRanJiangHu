const CACHE_VERSION = '2026-06-06-v2';
const CACHE_NAME = `msjh-item-preset-feedback-${CACHE_VERSION}`;
const META_CACHE_NAME = `msjh-item-preset-feedback-meta-${CACHE_VERSION}`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function isPresetFeedbackAsset(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname === '/assets/item-preset-feedback-data.json') {
    return true;
  }
  return url.hostname === 's3.hi168.com' && url.pathname.includes('/MoRanJiangHu/preset-items/');
}

function metaRequestFor(url) {
  return new Request(`${self.location.origin}/__item-preset-feedback-cache-meta?url=${encodeURIComponent(url)}`);
}

async function readCachedAt(url) {
  const metaCache = await caches.open(META_CACHE_NAME);
  const response = await metaCache.match(metaRequestFor(url));
  if (!response) return 0;
  const value = Number(await response.text());
  return Number.isFinite(value) ? value : 0;
}

async function writeCachedAt(url) {
  const metaCache = await caches.open(META_CACHE_NAME);
  await metaCache.put(metaRequestFor(url), new Response(String(Date.now()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  }));
}

async function cacheFirstForOneDay(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true });
  const cachedAt = cached ? await readCachedAt(request.url) : 0;
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(request, response.clone());
      await writeCachedAt(request.url);
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const expected = new Set([CACHE_NAME, META_CACHE_NAME]);
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('msjh-item-preset-feedback-') && !expected.has(name))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (!isPresetFeedbackAsset(event.request)) return;
  event.respondWith(cacheFirstForOneDay(event.request));
});
