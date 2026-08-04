/*
 * Serves out/ the way Vercel serves a static export — clean URLs (`/week` ->
 * `week.html`), so what you test locally behaves like production.
 *
 * `npm run preview`, then open http://localhost:4000. Service workers are
 * allowed on localhost, so this is where you can prove offline actually works:
 * load it once, then DevTools > Network > Offline and reload.
 */

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../out", import.meta.url));
const port = Number(process.env.PORT ?? 4000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Mirror of the host's resolution order: exact file, then `<path>.html`. */
function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = join(outDir, clean);
  if (existsSync(base) && statSync(base).isFile()) return base;
  if (clean === "/" || clean === "\\") {
    const index = join(outDir, "index.html");
    if (existsSync(index)) return index;
  }
  const html = `${base.replace(/\/$/, "")}.html`;
  if (existsSync(html) && statSync(html).isFile()) return html;
  return null;
}

if (!existsSync(outDir)) {
  console.error("No out/ directory — run `npm run build` first.");
  process.exit(1);
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const file = resolve(pathname);

  if (!file) {
    const notFound = join(outDir, "404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    if (existsSync(notFound)) return createReadStream(notFound).pipe(res);
    return res.end("Not found");
  }

  const headers = { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" };
  // Match the production header so worker updates are always picked up.
  if (pathname === "/sw.js") headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

  res.writeHead(200, headers);
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Coach static preview — http://localhost:${port}`);
});
