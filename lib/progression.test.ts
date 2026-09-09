import { test } from "node:test";
import assert from "node:assert/strict";

import {
  COMEBACK_BADGE,
  daysBetween,
  daysSinceLastCompletedSession,
  epley,
  nextTarget,
  roundToPlates,
  targetRow,
  workingKg,
  type HistoryEntry,
} from "./progression";
import { weightsConfig, defaultReps, repRangeLabel } from "./weights";

const cfg = (id: string) => {
  const c = weightsConfig[id];
  if (!c) throw new Error(`no config for ${id}`);
  return c;
};

/** A completed session: every set ticked done. */
function sess(date: string, kg: number, reps: number[]): HistoryEntry {
  return { date, sets: reps.map((r) => ({ kg, reps: r, done: true })) };
}

const SQUAT = "monday-barbell-back-squat";
const BENCH = "friday-barbell-bench-press";
const PULLDOWN = "friday-lat-pulldown";
const ASSIST = "wednesday-assisted-pull-up-close-grip-lat-pulldown";
const PLANK = "monday-plank-side-plank";
const KNEE = "thursday-hanging-knee-raise";
const SUPERSET = "friday-superset-db-curl-rope-pushdown";
const LEGPRESS = "monday-leg-press";

// ------------------------------------------------------------- §4.1 first ---

test("no history → the config's starting weight and reps", () => {
  const t = nextTarget(SQUAT, [], cfg(SQUAT), "2026-09-09");
  assert.equal(t.kg, 40);
  assert.equal(t.reps, 8);
  assert.equal(t.reason, "first time");
  assert.equal(t.badge, undefined);
});

test("acceptance: fresh install prescribes the coach's Monday numbers", () => {
  const today = "2026-09-09";
  const expect: [string, number, number, number][] = [
    [SQUAT, 40, 8, 3],
    ["monday-romanian-deadlift-rdl", 30, 8, 3],
    [LEGPRESS, 40, 10, 3],
    ["monday-lying-leg-curl", 20, 12, 3],
    ["monday-standing-calf-raise", 30, 12, 4],
  ];
  for (const [id, kg, reps, sets] of expect) {
    const t = nextTarget(id, [], cfg(id), today);
    assert.equal(t.kg, kg, `${id} kg`);
    assert.equal(t.reps, reps, `${id} reps`);
    assert.equal(cfg(id).sets, sets, `${id} sets`);
    assert.ok(t.kg > 0 && t.reps > 0, `${id} must never prescribe 0`);
  }
  const plank = nextTarget(PLANK, [], cfg(PLANK), today);
  assert.equal(plank.seconds, 30);
});

test("a session with un-ticked sets does not count as history", () => {
  const partial: HistoryEntry[] = [
    {
      date: "2026-09-02",
      sets: [
        { kg: 45, reps: 10, done: true },
        { kg: 45, reps: 10, done: true },
        { kg: 45, reps: 10, done: false },
      ],
    },
  ];
  const t = nextTarget(SQUAT, partial, cfg(SQUAT), "2026-09-09");
  assert.equal(t.reason, "first time");
  assert.equal(t.kg, 40);
});

// ------------------------------------------------------- §4.2 up / hold / down ---

test("acceptance: squat 40 × 10/10/10 → 45 kg × 6, 'all sets hit top of range'", () => {
  const t = nextTarget(SQUAT, [sess("2026-09-07", 40, [10, 10, 10])], cfg(SQUAT), "2026-09-14");
  assert.equal(t.kg, 45);
  assert.equal(t.reps, 6);
  assert.match(t.reason, /all sets hit top of range/);
  assert.match(t.reason, /\+5kg/);
});

test("acceptance: bench 40 × 10/10/7 → 40 kg × 8, 'build reps first'", () => {
  const t = nextTarget(BENCH, [sess("2026-09-04", 40, [10, 10, 7])], cfg(BENCH), "2026-09-11");
  assert.equal(t.kg, 40);
  assert.equal(t.reps, 8);
  assert.equal(t.reason, "build reps first");
});

test("acceptance: pulldown 30 × 7/6/5 twice at 30 kg → 25 kg × 8, 'stalled twice'", () => {
  const history = [
    sess("2026-08-28", 30, [7, 6, 5]),
    sess("2026-09-04", 30, [7, 6, 5]),
  ];
  const t = nextTarget(PULLDOWN, history, cfg(PULLDOWN), "2026-09-11");
  assert.equal(t.kg, 25);
  assert.equal(t.reps, 8);
  assert.equal(t.reason, "stalled twice → one step down");
});

test("one bad session alone does not drop the weight", () => {
  const t = nextTarget(PULLDOWN, [sess("2026-09-04", 30, [7, 6, 5])], cfg(PULLDOWN), "2026-09-11");
  assert.equal(t.kg, 30);
  assert.equal(t.reps, 8); // min(repMax, max(repMin, 5 + 1))
  assert.equal(t.reason, "build reps first");
});

test("two bad sessions at DIFFERENT weights do not count as a stall", () => {
  const history = [
    sess("2026-08-28", 35, [7, 6, 5]),
    sess("2026-09-04", 30, [7, 6, 5]),
  ];
  const t = nextTarget(PULLDOWN, history, cfg(PULLDOWN), "2026-09-11");
  assert.equal(t.kg, 30);
  assert.equal(t.reason, "build reps first");
});

test("build-reps clamps into the range: reps never exceed repMax", () => {
  // repMin 8, repMax 10 — 9 reps on the worst set means "go for 10", not 11.
  const rdl = "monday-romanian-deadlift-rdl";
  const t = nextTarget(rdl, [sess("2026-09-07", 30, [10, 10, 9])], cfg(rdl), "2026-09-14");
  assert.equal(t.reps, 10);
  assert.equal(t.kg, 30);
});

// ---------------------------------------------------------------- §5 comeback ---

test("acceptance: squat last done at 45 kg, 12 days ago → 40 kg + comeback badge", () => {
  const t = nextTarget(SQUAT, [sess("2026-08-28", 45, [8, 8, 8])], cfg(SQUAT), "2026-09-09");
  assert.equal(t.kg, 40);
  assert.equal(t.reps, 6);
  assert.equal(t.badge, COMEBACK_BADGE);
});

test("acceptance: 25 days off → two steps down, floored at the config weight", () => {
  const t = nextTarget(SQUAT, [sess("2026-08-15", 45, [8, 8, 8])], cfg(SQUAT), "2026-09-09");
  assert.equal(t.kg, 40); // 45 − 2×5 = 35, floored at the config's 40
  assert.equal(t.badge, COMEBACK_BADGE);
});

test("10 days off is still not a comeback (the rule is > 10)", () => {
  const t = nextTarget(SQUAT, [sess("2026-08-30", 45, [8, 8, 8])], cfg(SQUAT), "2026-09-09");
  assert.equal(t.badge, undefined);
  assert.equal(t.kg, 45);
});

test("time away outranks a session that hit the top of the range", () => {
  const t = nextTarget(SQUAT, [sess("2026-08-20", 50, [10, 10, 10])], cfg(SQUAT), "2026-09-09");
  assert.equal(t.kg, 45); // comeback from 50, not the +5 the reps earned
  assert.equal(t.badge, COMEBACK_BADGE);
});

test("daysSinceLastCompletedSession only counts completed sessions", () => {
  const history: HistoryEntry[] = [
    sess("2026-08-28", 40, [8, 8, 8]),
    { date: "2026-09-07", sets: [{ kg: 40, reps: 8, done: false }] },
  ];
  assert.equal(daysSinceLastCompletedSession(history, 3, "2026-09-09"), 12);
  assert.equal(daysSinceLastCompletedSession([], 3, "2026-09-09"), null);
});

// -------------------------------------------------------------- §4.4 rounding ---

test("bench +2.5 rounds up to a real 5 kg jump without 1.25 kg plates", () => {
  const t = nextTarget(BENCH, [sess("2026-09-04", 40, [10, 10, 10])], cfg(BENCH), "2026-09-11");
  assert.equal(t.kg, 45);
});

test("with 1.25 kg plates the same session gives the true +2.5", () => {
  const t = nextTarget(BENCH, [sess("2026-09-04", 40, [10, 10, 10])], cfg(BENCH), "2026-09-11", {
    allow125: true,
  });
  assert.equal(t.kg, 42.5);
});

test("an earned step-down may go under the starting weight (the start is only an estimate)", () => {
  const history = [
    sess("2026-08-31", 40, [8, 8, 8]), // repMin is 10 — both sessions are short
    sess("2026-09-07", 40, [8, 8, 8]),
  ];
  const t = nextTarget(LEGPRESS, history, cfg(LEGPRESS), "2026-09-08");
  assert.equal(t.reason, "stalled twice → one step down");
  assert.equal(t.kg, 30);
});

test("a step-down never goes negative", () => {
  const lateral = "friday-db-lateral-raise"; // starts at 5 kg, step 2.5
  const history = [sess("2026-08-31", 2.5, [8, 8, 8]), sess("2026-09-07", 2.5, [8, 8, 8])];
  assert.equal(nextTarget(lateral, history, cfg(lateral), "2026-09-08").kg, 0);
});

test("roundToPlates follows plate reality per equipment type", () => {
  assert.equal(roundToPlates(42.5, "barbell", 2.5), 45);
  assert.equal(roundToPlates(42.5, "barbell", 2.5, true), 42.5);
  assert.equal(roundToPlates(13.7, "dumbbell", 2.5), 12.5);
  assert.equal(roundToPlates(47, "machine", 10), 50);
  assert.equal(roundToPlates(16, "cable", 5), 15);
  assert.equal(roundToPlates(3.3, "bodyweight", 0), 3.3);
});

// ---------------------------------------------------------------- §4.2 assisted ---

test("acceptance: assisted pull-up 30 assist × 12/12/12 → 25 assist × 8", () => {
  const t = nextTarget(ASSIST, [sess("2026-09-02", 30, [12, 12, 12])], cfg(ASSIST), "2026-09-09");
  assert.equal(t.kg, 25);
  assert.equal(t.reps, 8);
  assert.match(t.reason, /all sets hit top of range/);
});

test("assisted: reaching zero assistance flags the first real pull-up", () => {
  const t = nextTarget(ASSIST, [sess("2026-09-02", 5, [12, 12, 12])], cfg(ASSIST), "2026-09-09");
  assert.equal(t.kg, 0);
  assert.match(t.badge ?? "", /pull-up/);
});

test("assisted: a stall ADDS assistance", () => {
  const stall = [sess("2026-08-26", 20, [6, 6, 6]), sess("2026-09-02", 20, [6, 6, 6])];
  assert.equal(nextTarget(ASSIST, stall, cfg(ASSIST), "2026-09-09").kg, 25);
});

test("assisted: a comeback also means more assistance, capped at the start", () => {
  const t = nextTarget(ASSIST, [sess("2026-08-26", 15, [10, 10, 10])], cfg(ASSIST), "2026-09-09");
  assert.equal(t.kg, 20);
  assert.equal(t.badge, COMEBACK_BADGE);
});

// ------------------------------------------------------------ §4.2 time / bodyweight ---

test("time: the plank hold is what progresses", () => {
  const first = nextTarget(PLANK, [], cfg(PLANK), "2026-09-09");
  assert.equal(first.seconds, 30);
  assert.equal(first.reason, "first time");

  const held: HistoryEntry[] = [
    { date: "2026-09-07", sets: [30, 30, 30].map((r) => ({ kg: 0, reps: r, done: true })) },
  ];
  const t = nextTarget(PLANK, held, cfg(PLANK), "2026-09-14");
  assert.equal(t.seconds, 35);
  assert.equal(t.kg, 0);
});

test("time: a comeback shortens the hold, never below the starting 30 s", () => {
  const twentyDaysOff: HistoryEntry[] = [
    { date: "2026-08-20", sets: [45, 45, 45].map((r) => ({ kg: 0, reps: r, done: true })) },
  ];
  const one = nextTarget(PLANK, twentyDaysOff, cfg(PLANK), "2026-09-09");
  assert.equal(one.seconds, 40); // 20 days off → one step
  assert.equal(one.badge, COMEBACK_BADGE);

  const held: HistoryEntry[] = [
    { date: "2026-08-14", sets: [45, 45, 45].map((r) => ({ kg: 0, reps: r, done: true })) },
  ];
  const t = nextTarget(PLANK, held, cfg(PLANK), "2026-09-09");
  assert.equal(t.seconds, 35); // 26 days off → 45 − 2×5
  assert.equal(t.badge, COMEBACK_BADGE);

  const short: HistoryEntry[] = [
    { date: "2026-08-20", sets: [30, 30, 30].map((r) => ({ kg: 0, reps: r, done: true })) },
  ];
  assert.equal(nextTarget(PLANK, short, cfg(PLANK), "2026-09-09").seconds, 30);
});

test("bodyweight: reps go up, load stays at zero", () => {
  const t = nextTarget(KNEE, [sess("2026-09-03", 0, [10, 10, 10])], cfg(KNEE), "2026-09-10");
  assert.equal(t.kg, 0);
  assert.equal(t.reps, 11);

  const topped = nextTarget(KNEE, [sess("2026-09-03", 0, [15, 15, 15])], cfg(KNEE), "2026-09-10");
  assert.equal(topped.kg, 0);
  assert.equal(topped.reps, 15);
  assert.match(topped.reason, /make the movement harder/);
});

// ------------------------------------------------------------------ §4.2 superset ---

test("superset: each half progresses on its own", () => {
  const history: HistoryEntry[] = [
    {
      date: "2026-09-04",
      sets: [
        { kg: 7.5, reps: 12, done: true, part: 0 },
        { kg: 7.5, reps: 12, done: true, part: 0 },
        { kg: 7.5, reps: 12, done: true, part: 0 },
        { kg: 15, reps: 10, done: true, part: 1 },
        { kg: 15, reps: 10, done: true, part: 1 },
        { kg: 15, reps: 10, done: true, part: 1 },
      ],
    },
  ];
  const t = nextTarget(SUPERSET, history, cfg(SUPERSET), "2026-09-11");
  assert.equal(t.parts?.length, 2);
  assert.equal(t.parts?.[0].name, "DB Curl");
  assert.equal(t.parts?.[0].kg, 10); // 7.5 + 2.5, all sets at the top
  assert.equal(t.parts?.[0].reps, 10);
  assert.equal(t.parts?.[1].name, "Rope Pushdown");
  assert.equal(t.parts?.[1].kg, 15); // still building reps
  assert.equal(t.parts?.[1].reps, 11);
});

test("superset: with no history both halves start at their config weights", () => {
  const t = nextTarget(SUPERSET, [], cfg(SUPERSET), "2026-09-09");
  assert.equal(t.parts?.[0].kg, 7.5);
  assert.equal(t.parts?.[1].kg, 15);
  assert.ok(t.parts?.every((p) => p.reason === "first time"));
});

// ------------------------------------------------------------------- §4.5 override ---

test("an override replaces the logged weight as the basis for the next jump", () => {
  const history = [sess("2026-09-07", 45, [10, 10, 10])];
  const t = nextTarget(SQUAT, history, cfg(SQUAT), "2026-09-14", { overrideKg: 50 });
  assert.equal(t.kg, 55);
  assert.equal(t.reps, 6);
});

// --------------------------------------------------------------------- helpers ---

test("daysBetween counts calendar days across a month boundary", () => {
  assert.equal(daysBetween("2026-08-28", "2026-09-09"), 12);
  assert.equal(daysBetween("2026-09-09", "2026-09-09"), 0);
  assert.equal(daysBetween("2026-09-10", "2026-09-09"), -1);
});

test("workingKg is the weight used on most sets", () => {
  assert.equal(workingKg([{ kg: 40, reps: 8, done: true }, { kg: 40, reps: 8, done: true }, { kg: 35, reps: 8, done: true }]), 40);
  assert.equal(workingKg([]), 0);
});

test("epley estimates a 1RM", () => {
  assert.equal(epley(40, 10), 53.33);
  assert.equal(epley(0, 10), 0);
});

test("defaultReps follows the coach's rule table", () => {
  assert.equal(defaultReps(6, 10), 8);
  assert.equal(defaultReps(8, 12), 8);
  assert.equal(defaultReps(10, 12), 10);
  assert.equal(defaultReps(12, 15), 12);
  assert.equal(defaultReps(10, 15), 12);
});

test("labels read the way the card shows them", () => {
  assert.equal(repRangeLabel({ repMin: 6, repMax: 10 }), "6–10");
  assert.equal(repRangeLabel({ repMin: 12, repMax: 12 }), "12");
  assert.equal(targetRow({ kg: 40, reps: 10, reason: "" }, 3), "40 × 10, 10, 10");
  assert.equal(targetRow({ kg: 0, reps: 0, seconds: 30, reason: "" }, 3), "30s × 3");
});

test("every configured exercise produces a usable first-time target", () => {
  for (const [id, c] of Object.entries(weightsConfig)) {
    const t = nextTarget(id, [], c, "2026-09-09");
    assert.equal(t.reason === "first time" || t.parts?.every((p) => p.reason === "first time"), true, id);
    const shown = t.seconds ?? t.reps;
    assert.ok(shown > 0, `${id} must prescribe a real target, got ${shown}`);
    assert.ok(c.sets > 0, `${id} needs a set count`);
  }
});
