/// <reference lib="webworker" />

/*
 * Coach — offline service worker (Serwist).
 *
 * Built by `serwist build`, which runs AFTER `next build` (see serwist.config.js).
 * That ordering is the whole point: the exported site in `out/` only exists once
 * Next has finished, so this is the only way the precache list can contain the
 * real page HTML and RSC payloads rather than just the JS chunks.
 *
 * Do not edit the generated `out/sw.js`. Edit this file.
 */

import { defaultCache } from "@serwist/next/worker";
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
  type SerwistPlugin,
} from "serwist";
import exerciseImages from "../data/exerciseImages.json";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Replaced at build time with the real precache manifest.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const YEAR = 365 * 24 * 60 * 60;

/**
 * The 134 exercise demo photos. They are ~7 MB, so they are deliberately NOT in
 * the precache manifest — precaching is all-or-nothing, and one failed photo on
 * a weak signal would void the entire install. They are warmed separately after
 * activation instead, and served cache-first below.
 */
const PHOTO_CACHE = "coach-exercise-photos";
const PHOTO_URLS = [
  ...new Set(
    Object.values(exerciseImages as Record<string, { images?: string[] }>).flatMap(
      (entry) => entry.images ?? [],
    ),
  ),
];

/**
 * Refuses to store anything that is specific to one signed-in user.
 *
 * A shared Cache Storage bucket has no concept of "whose response is this", so a
 * cached authenticated response is served to whoever opens the app next — and it
 * survives sign-out. Belt and braces alongside the NetworkOnly rules below.
 */
const neverCachePrivate: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (response.headers.has("Set-Cookie")) return null;
    const vary = response.headers.get("Vary")?.toLowerCase() ?? "";
    if (vary.includes("cookie") || vary.includes("authorization")) return null;
    const control = response.headers.get("Cache-Control")?.toLowerCase() ?? "";
    if (control.includes("private") || control.includes("no-store")) return null;
    return response;
  },
};

/*
 * Order matters: the first matching rule wins. These sit in front of
 * `defaultCache`, which is tuned for a server-rendered Next app and would
 * otherwise apply weaker strategies (StaleWhileRevalidate for images,
 * NetworkFirst for navigations) than this app wants.
 */
const runtimeCaching: RuntimeCaching[] = [
  // Build assets. Every filename carries a content hash, so a hit is always
  // correct and revalidation is wasted bytes.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 256,
          maxAgeSeconds: YEAR,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },

  // Cross-origin fonts. Inert today — next/font/google self-hosts the Outfit,
  // Inter and JetBrains Mono files into /_next/static/media at build time, so
  // nothing is ever requested from Google. Kept for the day a font is added by
  // <link> instead.
  {
    matcher: ({ url }) =>
      url.origin === "https://fonts.googleapis.com" ||
      url.origin === "https://fonts.gstatic.com",
    handler: new CacheFirst({
      cacheName: "cross-origin-fonts",
      plugins: [
        // Opaque cross-origin responses report status 0; without this they are
        // dropped and every launch re-downloads the font.
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 16,
          maxAgeSeconds: YEAR,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },

  // Exercise photos and everything else in /public. Content never changes at a
  // given path — a new photo gets a new build and a new cache generation.
  {
    matcher: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      (request.destination === "image" ||
        /\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname)),
    handler: new CacheFirst({
      cacheName: PHOTO_CACHE,
      plugins: [
        new ExpirationPlugin({
          // 134 photos today. The cap is headroom, not a limit to hit: an
          // eviction here means a silent hole in an offline workout.
          maxEntries: 300,
          maxAgeSeconds: YEAR,
          maxAgeFrom: "last-used",
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },

  // Page navigations. Precache answers first (see the constructor below), so
  // this only runs for a URL that was not in the build — render whatever is
  // stored, refresh behind the scenes.
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: new StaleWhileRevalidate({
      cacheName: "pages",
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeFrom: "last-used" })],
    }),
  },

  // RSC payloads. In `output: export` mode a client-side navigation fetches
  // `<route>.txt`, not the HTML — miss these and tapping the bottom nav offline
  // fails even though the page itself is cached.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && url.pathname.endsWith(".txt"),
    handler: new StaleWhileRevalidate({
      cacheName: "rsc-payloads",
      plugins: [new ExpirationPlugin({ maxEntries: 128, maxAgeFrom: "last-used" })],
    }),
  },

  // Auth endpoints: never stored, at any age, under any strategy.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && /^\/api\/(?:auth|me|session)\b/.test(url.pathname),
    handler: new NetworkOnly(),
  },

  // Any request carrying credentials is user-specific by definition.
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      url.pathname.startsWith("/api/") &&
      (request.headers.has("Authorization") || request.credentials === "include"),
    handler: new NetworkOnly(),
  },

  // Everything else under /api. Short timeout so a dead connection falls back to
  // the last good response fast instead of hanging the UI for 10 seconds.
  // Inert today: `output: export` cannot emit route handlers, so this app ships
  // no /api at all. It is here for when a backend arrives.
  {
    matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
    method: "GET",
    handler: new NetworkFirst({
      cacheName: "api",
      networkTimeoutSeconds: 3,
      plugins: [
        neverCachePrivate,
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 }),
      ],
    }),
  },

  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // Delete precaches left by earlier versions of this worker.
    cleanupOutdatedCaches: true,
    // Next 16's segment router requests RSC payloads with a `?_rsc=<hash>`
    // buster: `/week/__next._tree.txt?_rsc=pdsn5k6R`. The precache is keyed on
    // the bare path, so without stripping this every one of them misses, the
    // router gives up and does a full-document MPA reload on each tap — the app
    // still works offline, but it stops behaving like an app.
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^_rsc$/],
  },
  // Deliberately false. `true` would make a new build take over the page the
  // moment it installs, swapping assets under a workout that is already open —
  // and it would mean there is never a "waiting" worker for the update toast in
  // components/ServiceWorker.tsx to find. The client posts SKIP_WAITING when the
  // user taps the toast; Serwist listens for that message.
  skipWaiting: false,
  // Safe on its own: it only matters on the very first install, where it lets
  // the worker start serving the page that registered it.
  clientsClaim: true,
  // No effect under `output: export` (there is no server to preload from), and
  // it costs a wasted network request per navigation while offline.
  navigationPreload: false,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

/**
 * Pull the exercise photos down in the background, once the app is already
 * usable. Failures are per-file and silent: the cache-first rule above picks up
 * anything missing the next time it is asked for with a signal.
 *
 * Registered before `addEventListeners()` so it runs alongside Serwist's own
 * activate handler rather than replacing it.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(warmPhotoCache());
});

async function warmPhotoCache(): Promise<void> {
  const cache = await caches.open(PHOTO_CACHE);
  const stored = new Set(
    (await cache.keys()).map((request) => new URL(request.url).pathname),
  );
  const missing = PHOTO_URLS.filter((url) => !stored.has(url));

  for (let i = 0; i < missing.length; i += 6) {
    await Promise.all(
      missing.slice(i, i + 6).map(async (url) => {
        try {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) await cache.put(url, response);
        } catch {
          // Offline mid-warm. Nothing to do — it gets cached on first view.
        }
      }),
    );
  }
}

serwist.addEventListeners();
