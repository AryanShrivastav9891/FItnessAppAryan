// @ts-check
/*
 * Serwist build configuration — "configurator mode".
 *
 * The usual `withSerwist(nextConfig)` wrapper is a webpack plugin, and Next runs
 * every bundler plugin BEFORE it prerenders pages. Under `output: "export"` that
 * means the precache manifest would be built while `out/` is still empty: you
 * get the JS chunks and nothing else, and the app is not actually offline —
 * every page is a network miss. (serwist/serwist#230.)
 *
 * Configurator mode fixes that by making the worker a separate build step that
 * runs after `next build`, so it can glob the finished export. It is also why
 * nothing needs to change in next.config.ts, and why this survives Turbopack —
 * there is no bundler plugin involved at all.
 *
 * Run by `npm run build`:  next build && serwist build serwist.config.mjs
 */

import { serwist } from "@serwist/next/config";

/** `out/index.html` -> `/`, `out/week.html` -> `/week`, everything else -> `/<path>`. */
const toDeployedUrl = (entries) => ({
  manifest: entries.map((entry) => {
    if (entry.url === "index.html") return { ...entry, url: "/" };
    if (entry.url.endsWith("/index.html")) {
      return { ...entry, url: `/${entry.url.slice(0, -"index.html".length)}` };
    }
    if (entry.url.endsWith(".html")) {
      return { ...entry, url: `/${entry.url.slice(0, -".html".length)}` };
    }
    return { ...entry, url: `/${entry.url}` };
  }),
  warnings: [],
});

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "out/sw.js",

  // Glob the deployed artifact, not `.next/`. Under `output: "export"` the `out/`
  // directory is what Vercel serves, and it is the only place the `.txt` RSC
  // payloads exist — they are written during export, never into `.next/`.
  globDirectory: "out",

  // Serwist's own prerender globbing reads `.next/server/app/**/*.html`, which
  // would double up on what is already being globbed from `out/`.
  precachePrerendered: false,

  globPatterns: [
    "**/*.html",
    // Client-side navigation payloads. Without these, tapping the bottom nav
    // offline fails even though every page HTML is cached.
    "**/*.txt",
    "_next/static/**/*",
    "*.{ico,svg,png,webmanifest,json}",
  ],

  globIgnores: [
    // Served by the host on a miss; requesting them directly 404s, which fails
    // the whole precache install.
    "404.html",
    "_not-found.html",
    "_not-found.txt",
    "_not-found/**",
    // ~7 MB of exercise photos. Precaching is all-or-nothing, so one failed
    // photo on a weak signal would void the entire install. app/sw.ts warms
    // these after activation instead, tolerating per-file failure.
    "exercises/**",
  ],

  // Matched against the pre-transform path, i.e. before toDeployedUrl adds the
  // leading slash. These filenames already contain a content hash, so adding a
  // revision query param on top would just double the cache key.
  dontCacheBustURLsMatching: /^_next\/static\//,

  manifestTransforms: [toDeployedUrl],

  esbuildOptions: {
    // The CLI defaults to "esm", which would force the client to register the
    // worker with `{ type: "module" }` — unsupported before Safari 16.4. An IIFE
    // registers as a classic worker everywhere and costs nothing here, since the
    // whole worker is bundled into one file with no imports left.
    format: "iife",
    // The CLI does not define this itself, and `defaultCache` from
    // @serwist/next/worker branches on it. Left undefined, the bundled worker
    // reaches for a bare `process` global that does not exist in a service
    // worker and dies on evaluation — the registration fails with
    // "ServiceWorker script evaluation failed" and nothing is ever cached.
    define: { "process.env.NODE_ENV": '"production"' },
  },
});
