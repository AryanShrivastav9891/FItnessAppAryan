/*
 * Builds out/sw.js from scripts/sw-template.js.
 *
 * Next gives every chunk a content hash in its filename, so the list of files
 * the app needs changes on every build and cannot be maintained by hand. This
 * walks the finished export and injects the real list, plus a version stamp
 * derived from it — so the version only changes when the files actually do.
 *
 * Run automatically by `npm run build`.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "out");
const templatePath = join(root, "scripts", "sw-template.js");

/** Every file under out/, as paths relative to out/. */
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else found.push(relative(outDir, full).split(sep).join("/"));
  }
  return found;
}

/**
 * The URL the browser will actually ask for.
 * `index.html` -> `/`, `week.html` -> `/week`, everything else verbatim.
 * We never precache the `.html` path itself: hosts redirect it to the clean
 * URL, and `cache.add` rejects redirected responses.
 */
function toUrl(file) {
  if (file === "index.html") return "/";
  if (file.endsWith(".html")) return `/${file.slice(0, -".html".length)}`;
  return `/${file}`;
}

// The error pages are served by the host on a miss and would 404 if requested
// directly, which would make them fail to cache. They are not needed offline.
const SKIP = /^(404\.html|_not-found(\.html|\.txt)?$|_not-found\/)/;

const files = walk(outDir).filter((f) => f !== "sw.js" && !SKIP.test(f));

const media = [];
const shell = [];
for (const file of files) {
  (file.startsWith("exercises/") ? media : shell).push(toUrl(file));
}
shell.sort();
media.sort();

if (!shell.length) {
  console.error("gen-sw: out/ is empty — run `next build` first.");
  process.exit(1);
}

// Version tracks content: identical builds keep the cache, any change busts it.
const version = createHash("sha256")
  .update(JSON.stringify({ shell, media }))
  .digest("hex")
  .slice(0, 12);

const manifest = `const MANIFEST = ${JSON.stringify({ version, shell, media })};`;
const template = readFileSync(templatePath, "utf8");
const marker = /^const MANIFEST = .*\/\* __COACH_MANIFEST__ \*\/$/m;

if (!marker.test(template)) {
  console.error("gen-sw: manifest marker missing from scripts/sw-template.js");
  process.exit(1);
}

writeFileSync(join(outDir, "sw.js"), template.replace(marker, manifest), "utf8");

const mb = (
  media.reduce((n, u) => n + statSync(join(outDir, u.slice(1))).size, 0) /
  1024 /
  1024
).toFixed(1);
console.log(
  `gen-sw: out/sw.js — ${shell.length} shell files + ${media.length} photos (${mb} MB), version ${version}`,
);
