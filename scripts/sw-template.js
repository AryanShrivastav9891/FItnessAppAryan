/*
 * Coach — offline service worker.
 *
 * Do not edit the generated `out/sw.js`. Edit THIS file; `scripts/gen-sw.mjs`
 * injects the file manifest below and writes the result to `out/sw.js` at the
 * end of every build.
 *
 * Behaviour:
 *   install  — download every page, script, style, font and RSC payload, so the
 *              whole app is on the device the first time there is any network.
 *   activate — take control, drop stale builds, then fill in the exercise
 *              photos in the background (they are ~7 MB, so they must never
 *              hold up the app being usable).
 *   fetch    — cache first. Nothing waits on the network, so the app opens the
 *              same with no signal as with full signal.
 */

// Replaced at build time by scripts/gen-sw.mjs.
const MANIFEST = { version: "dev", shell: [], media: [] }; /* __COACH_MANIFEST__ */

// The shell is versioned: every build ships new hashed chunk names.
const SHELL_CACHE = `coach-shell-${MANIFEST.version}`;
// Photos are content-immutable and ~7 MB, so they survive across builds.
const MEDIA_CACHE = "coach-media-v1";

/** Add URLs one by one so a single failure cannot void the whole install. */
async function addAll(cache, urls, batchSize = 12) {
  let failed = 0;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        try {
          await cache.add(new Request(url, { cache: "reload" }));
        } catch {
          // Offline mid-install, or a file that moved. The fetch handler caches
          // it on demand the next time there is network.
          failed += 1;
        }
      }),
    );
  }
  return failed;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await addAll(cache, MANIFEST.shell);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop shells from previous builds; keep the photo cache.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("coach-shell-") && n !== SHELL_CACHE)
          .map((n) => caches.delete(n)),
      );

      // Control the page straight away on first install.
      await self.clients.claim();

      // Only now, with the app already usable, pull the photos down. Anything
      // already stored from an earlier build is skipped.
      const media = await caches.open(MEDIA_CACHE);
      const stored = new Set(
        (await media.keys()).map((req) => new URL(req.url).pathname),
      );
      const missing = MANIFEST.media.filter((url) => !stored.has(url));
      if (missing.length) await addAll(media, missing, 6);
    })(),
  );
});

/** `/week/` and `/week` are the same cached page; `/` stays `/`. */
function routeKey(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      // Page loads: serve the stored page, and fall back to the home screen so
      // a stray URL never shows the browser's offline dinosaur.
      if (req.mode === "navigate") {
        const page = await caches.match(routeKey(url.pathname));
        if (page) return page;
        try {
          return await fetch(req);
        } catch {
          return (await caches.match("/")) ?? Response.error();
        }
      }

      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;

      // Not stored yet (a photo still downloading, say) — fetch and keep it.
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") {
          const target = url.pathname.startsWith("/exercises/")
            ? MEDIA_CACHE
            : SHELL_CACHE;
          const cache = await caches.open(target);
          await cache.put(req, res.clone());
        }
        return res;
      } catch {
        return Response.error();
      }
    })(),
  );
});
