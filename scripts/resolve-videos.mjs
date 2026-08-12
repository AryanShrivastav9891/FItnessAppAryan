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

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const planPath = join(root, "data", "plan.json");
const outPath = join(root, "data", "exerciseVideos.json");

/**
 * `--refresh` re-rolls the full-length pick for every exercise. Without it the
 * ids already committed are left exactly as they are and only the missing
 * pieces (a new exercise, or the shorts) are fetched — the full-length picks
 * were eyeballed once and should not silently change because YouTube reshuffled
 * its ranking overnight.
 */
const REFRESH = process.argv.includes("--refresh");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
// sp=EgIQAQ%3D%3D is YouTube's "Videos only" filter — no Shorts, playlists or channels.
const VIDEOS_ONLY = "EgIQAQ%3D%3D";
// sp=EgIYAQ%3D%3D is the "Shorts" filter — the vertical <60s clips.
const SHORTS_ONLY = "EgIYAQ%3D%3D";

/** How many shorts to keep per exercise. */
const SHORTS_PER_EXERCISE = 3;

// Pulls id + title + channel out of the first real result block.
const RESULT =
  /"videoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\].*?"ownerText":\{"runs":\[\{"text":"(.*?)"/g;

// Shorts come back as a different renderer with no separate title field — the
// human-readable name is only in the accessibility label.
const SHORT_RESULT =
  /"shortsLockupViewModel":\{"entityId":"shorts-shelf-item-([\w-]{11})","accessibilityText":"(.*?)"/g;

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

async function search(query, filter, attempt = 1) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query,
  )}&sp=${filter}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < 3) {
      await sleep(2000 * attempt);
      return search(query, filter, attempt + 1);
    }
    throw err;
  }
}

async function topResult(query) {
  const html = await search(query, VIDEOS_ONLY);
  RESULT.lastIndex = 0;
  const m = RESULT.exec(html);
  if (!m) throw new Error("no video in results");
  return { videoId: m[1], title: decode(m[2]), channel: decode(m[3]) };
}

/** "Perfect Squat Form, 2.2 million views - play Short" -> "Perfect Squat Form". */
function shortTitle(accessibilityText) {
  return decode(accessibilityText)
    .replace(/,\s*[\d.,]+\s*\w*\s*views?\s*-\s*play Short\s*$/i, "")
    .replace(/\s*-\s*play Short\s*$/i, "")
    .trim();
}

/** The top few Shorts for a query, excluding the full-length pick. */
async function topShorts(query, excludeId) {
  const html = await search(query, SHORTS_ONLY);
  SHORT_RESULT.lastIndex = 0;
  const found = [];
  const seen = new Set(excludeId ? [excludeId] : []);
  let m;
  while ((m = SHORT_RESULT.exec(html)) !== null) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const title = shortTitle(m[2]);
    if (!title) continue;
    found.push({ videoId: m[1], title });
    if (found.length === SHORTS_PER_EXERCISE) break;
  }
  if (!found.length) throw new Error("no shorts in results");
  return found;
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

/** What is already committed. Preserved unless --refresh says otherwise. */
const existing = existsSync(outPath)
  ? JSON.parse(readFileSync(outPath, "utf8"))
  : {};

console.log(
  `Resolving ${items.length} exercises (full-length + ${SHORTS_PER_EXERCISE} shorts each)` +
    `${REFRESH ? ", refreshing every pick" : ", keeping existing picks"} — this takes a few minutes.\n`,
);

const videos = {};
const failures = [];

for (const [i, item] of items.entries()) {
  const query = queryOf(item.video);
  const position = `${String(i + 1).padStart(2)}/${items.length}`;
  const prior = existing[item.id];

  if (!query) {
    failures.push(`${item.id} (not a search URL)`);
    console.log(`${position} ✗ ${item.name} — not a search URL`);
    continue;
  }

  // --- the full-length video -------------------------------------------------
  let main = null;
  if (prior?.videoId && !REFRESH) {
    main = { videoId: prior.videoId, title: prior.title, channel: prior.channel };
  } else {
    try {
      main = await topResult(query);
      await sleep(500); // be a polite client
    } catch (err) {
      failures.push(`${item.id} main (${err.message})`);
    }
  }

  // --- the shorts ------------------------------------------------------------
  let shorts = prior?.shorts?.length && !REFRESH ? prior.shorts : null;
  if (!shorts) {
    try {
      shorts = await topShorts(query, main?.videoId);
      await sleep(500);
    } catch (err) {
      shorts = [];
      failures.push(`${item.id} shorts (${err.message})`);
    }
  }

  if (!main && !shorts.length) {
    console.log(`${position} ✗ ${item.name} — nothing resolved`);
    continue;
  }

  videos[item.id] = { ...(main ?? {}), query, shorts };
  console.log(
    `${position} ✓ ${item.name} → ${main ? `${main.title} (${main.channel})` : "no full-length"} + ${shorts.length} shorts`,
  );
}

writeFileSync(outPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");

const withMain = Object.values(videos).filter((v) => v.videoId).length;
const withShorts = Object.values(videos).filter((v) => v.shorts?.length).length;
console.log(
  `\nWrote data/exerciseVideos.json — ${withMain}/${items.length} full-length, ${withShorts}/${items.length} with shorts.`,
);
if (failures.length) {
  console.log(`Unresolved (these fall back to the YouTube search link):`);
  for (const f of failures) console.log(`  - ${f}`);
}
