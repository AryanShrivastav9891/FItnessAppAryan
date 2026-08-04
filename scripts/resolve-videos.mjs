/*
 * Resolves each item's YouTube *search* URL in data/plan.json into a concrete
 * video id, and writes data/exerciseVideos.json.
 *
 * Why this exists: plan.json stores searches like
 *   https://www.youtube.com/results?search_query=barbell+back+squat+proper+form
 * and YouTube refuses to be framed on /results — only /embed/<id> can be
 * embedded. So the top result is resolved once, here, and committed.
 *
 * Run by hand (`npm run videos`), NOT as part of the build: a deploy must never
 * depend on scraping, and the picks should be eyeballed before shipping.
 * Re-running it may pick different videos as YouTube's ranking shifts.
 *
 * plan.json is never modified — the ids live in their own file, exactly like
 * data/exerciseImages.json.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const planPath = join(root, "data", "plan.json");
const outPath = join(root, "data", "exerciseVideos.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
// sp=EgIQAQ%3D%3D is YouTube's "Videos only" filter — no Shorts, playlists or channels.
const VIDEOS_ONLY = "EgIQAQ%3D%3D";

// Pulls id + title + channel out of the first real result block.
const RESULT =
  /"videoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\].*?"ownerText":\{"runs":\[\{"text":"(.*?)"/g;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The search terms the coach wrote, pulled back out of the stored URL. */
function queryOf(videoUrl) {
  try {
    const q = new URL(videoUrl).searchParams.get("search_query");
    return q ? q.replace(/\+/g, " ") : null;
  } catch {
    return null;
  }
}

function decode(text) {
  return text
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

async function topResult(query, attempt = 1) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query,
  )}&sp=${VIDEOS_ONLY}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    RESULT.lastIndex = 0;
    const m = RESULT.exec(html);
    if (!m) throw new Error("no video in results");
    return { videoId: m[1], title: decode(m[2]), channel: decode(m[3]) };
  } catch (err) {
    if (attempt < 3) {
      await sleep(2000 * attempt);
      return topResult(query, attempt + 1);
    }
    throw err;
  }
}

const plan = JSON.parse(readFileSync(planPath, "utf8"));

/** Every item that carries a video search, across all three lists. */
const items = [];
for (const day of plan.week) {
  for (const kind of ["warmup", "exercises", "static"]) {
    for (const item of day[kind] ?? []) {
      if (item.video) items.push({ id: item.id, name: item.name, kind, video: item.video });
    }
  }
}

console.log(`Resolving ${items.length} videos — this takes a couple of minutes.\n`);

const videos = {};
const failures = [];

for (const [i, item] of items.entries()) {
  const query = queryOf(item.video);
  const position = `${String(i + 1).padStart(2)}/${items.length}`;

  if (!query) {
    failures.push(`${item.id} (not a search URL)`);
    console.log(`${position} ✗ ${item.name} — not a search URL`);
    continue;
  }

  try {
    const found = await topResult(query);
    videos[item.id] = { ...found, query };
    console.log(`${position} ✓ ${item.name} → ${found.title} (${found.channel})`);
  } catch (err) {
    failures.push(`${item.id} (${err.message})`);
    console.log(`${position} ✗ ${item.name} — ${err.message}`);
  }

  await sleep(500); // be a polite client
}

writeFileSync(outPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");

console.log(`\nWrote data/exerciseVideos.json — ${Object.keys(videos).length}/${items.length} resolved.`);
if (failures.length) {
  console.log(`Unresolved (these fall back to the YouTube search link):`);
  for (const f of failures) console.log(`  - ${f}`);
}
