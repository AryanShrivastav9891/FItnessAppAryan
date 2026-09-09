// Unit tests without a test framework: esbuild bundles the *.test.ts files
// (resolving the "@/" alias and the JSON config) and node's built-in runner
// executes them. No new dependencies.

import { build } from "esbuild";
import { readdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outdir = path.join(root, ".test-build");

const entryPoints = readdirSync(path.join(root, "lib"))
  .filter((f) => f.endsWith(".test.ts"))
  .map((f) => path.join(root, "lib", f));

if (entryPoints.length === 0) {
  console.error("no *.test.ts files found in lib/");
  process.exit(1);
}

rmSync(outdir, { recursive: true, force: true });

await build({
  entryPoints,
  outdir,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  alias: { "@": root },
  // The package is CommonJS, so ESM output has to carry the .mjs extension.
  outExtension: { ".js": ".mjs" },
  logLevel: "warning",
});

const built = readdirSync(outdir)
  .filter((f) => f.endsWith(".mjs"))
  .map((f) => path.join(outdir, f));

spawn(process.execPath, ["--test", ...built], { stdio: "inherit" }).on("exit", (code) => {
  process.exit(code ?? 1);
});
