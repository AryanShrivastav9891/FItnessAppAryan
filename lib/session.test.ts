import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// lib/storage.ts is SSR-guarded on `window`, so a fake one is all it needs to
// run under node. Set up before anything touches storage.
const cells = new Map<string, string>();
Object.assign(globalThis, {
  CustomEvent: class {
    constructor(
      public type: string,
      public detail?: unknown,
    ) {}
  },
  window: {
    localStorage: {
      getItem: (k: string) => cells.get(k) ?? null,
      setItem: (k: string, v: string) => void cells.set(k, v),
      removeItem: (k: string) => void cells.delete(k),
    },
    dispatchEvent: () => true,
  },
});

import { week } from "./plan";
import { parseSets } from "./sets";
import { keys } from "./keys";
import { lsGet, lsSet } from "./storage";
import { fallbackConfig, getConfig, type ExerciseConfig } from "./weights";
import { nextTarget } from "./progression";
import {
  countDoneRaw,
  doneSetCount,
  makeRows,
  normalizeRows,
  rowCount,
  type DraftSet,
} from "./draft";
import {
  dayState,
  exportLogs,
  historyFor,
  importLogs,
  migrateLegacyLogs,
  normalizeStore,
  readLogs,
  statsFor,
  strengthSeries,
  updateLogs,
  sessionVolumeKg,
  type LogSession,
} from "./logs";

beforeEach(() => cells.clear());

const cfgOf = (ex: { id: string; sets: string }): ExerciseConfig => {
  const p = parseSets(ex.sets);
  return getConfig(ex.id) ?? fallbackConfig(p.count, p.repLow, p.repHigh);
};

const day = (id: string) => week.find((d) => d.id === id)!;

const targetFor = (id: string, today = "2026-09-09") => {
  const store = readLogs();
  const config = getConfig(id)!;
  return nextTarget(id, historyFor(store, id), config, today, {
    overrideKg: store.overrides[id]?.kg,
    allow125: store.settings.allow125,
  });
};

/** Fill a day's cards the way the UI does, tick the given exercises, finish. */
function logSession(
  dayId: string,
  date: string,
  lifts: Record<string, { kg?: number; reps: number[] }>,
): LogSession {
  const d = day(dayId);
  const exercises = [];
  let completed = 0;
  let total = 0;

  for (const ex of d.exercises) {
    const config = cfgOf(ex);
    total += config.sets;
    const target = targetFor(ex.id, date);
    const rows = makeRows(config, target);
    const want = lifts[ex.id];
    if (!want) continue;

    const ticked: DraftSet[] = rows.map((r, i) => ({
      ...r,
      kg: want.kg ?? r.kg,
      reps: want.reps[i] ?? r.reps,
      done: i < want.reps.length,
    }));
    lsSet(keys.setlog(date, ex.id), ticked);
    completed += countDoneRaw(ticked, config);
    exercises.push({ exerciseId: ex.id, sets: ticked.map((r) => ({ kg: r.kg, reps: r.reps, done: r.done })) });
  }

  const session: LogSession = {
    id: `${date}-${dayId}`,
    date,
    dayId,
    startedAt: 1,
    finishedAt: 60_000,
    status: completed >= total ? "done" : "partial",
    exercises,
  };
  updateLogs((s) => ({ ...s, sessions: [...s.sessions.filter((x) => x.id !== session.id), session] }));
  return session;
}

// ------------------------------------------------------------- set counting ---

test("set counts are unchanged: Monday 19, Friday 21", () => {
  const totals = Object.fromEntries(
    week.map((d) => [d.id, d.exercises.reduce((n, e) => n + cfgOf(e).sets, 0)]),
  );
  assert.equal(totals.monday, 19);
  assert.equal(totals.friday, 21);

  // and the config agrees with the plan's own "3 × 8–12" strings
  for (const d of week) {
    const fromPlan = d.exercises.reduce((n, e) => n + parseSets(e.sets).count, 0);
    assert.equal(totals[d.id], fromPlan, `${d.id} set count drifted from plan.json`);
  }
});

test("a superset renders two rows per set but still counts as one set", () => {
  const id = "friday-superset-db-curl-rope-pushdown";
  const config = getConfig(id)!;
  const rows = makeRows(config, targetFor(id));
  assert.equal(rowCount(config), 6);
  assert.equal(rows.length, 6);

  const halfTicked = rows.map((r) => ({ ...r, done: r.part === 0 }));
  assert.equal(doneSetCount(halfTicked, config), 0, "one half is not a set");

  const allTicked = rows.map((r) => ({ ...r, done: true }));
  assert.equal(doneSetCount(allTicked, config), 3);
});

// --------------------------------------------------------------- §7 prefill ---

test("acceptance: a fresh install never shows 0 kg / 0 reps", () => {
  for (const d of week) {
    for (const ex of d.exercises) {
      const config = cfgOf(ex);
      const rows = makeRows(config, targetFor(ex.id));
      for (const row of rows) {
        assert.ok(row.reps > 0, `${ex.id} set ${row.setIndex + 1} shows 0`);
        // A zero here is only allowed where the card renders "BW" instead of a
        // number: the two unloaded lifts and the plank hold.
        const unloaded =
          config.type === "bodyweight" || config.type === "time" || row.kg === 0;
        if (row.kg === 0) {
          assert.ok(
            unloaded && ["bodyweight", "time", "dumbbell"].includes(config.type),
            `${ex.id} shows 0 kg but is not an unloaded lift`,
          );
        }
      }
    }
  }
});

test("acceptance: Monday opens on the coach's numbers", () => {
  const rows = Object.fromEntries(
    day("monday").exercises.map((ex) => [ex.id, makeRows(cfgOf(ex), targetFor(ex.id))]),
  );
  assert.deepEqual(
    rows["monday-barbell-back-squat"].map((r) => [r.kg, r.reps]),
    [[40, 8], [40, 8], [40, 8]],
  );
  assert.deepEqual(rows["monday-romanian-deadlift-rdl"][0], { kg: 30, reps: 8, done: false, setIndex: 0 });
  assert.deepEqual(rows["monday-leg-press"][0].reps, 10);
  assert.equal(rows["monday-lying-leg-curl"][0].kg, 20);
  assert.equal(rows["monday-standing-calf-raise"].length, 4);
  assert.equal(rows["monday-plank-side-plank"][0].reps, 30); // 30 s hold
});

test("rest lengths come from the plan, per exercise", () => {
  const rest = Object.fromEntries(day("monday").exercises.map((e) => [e.id, e.restSeconds]));
  assert.equal(rest["monday-barbell-back-squat"], 150);
  assert.equal(rest["monday-lying-leg-curl"], 75);
  assert.equal(rest["monday-plank-side-plank"], 60);
});

// ------------------------------------------------------------- §7 end-to-end ---

test("acceptance: log squat 40 × 10/10/10, finish, and next Monday says 45 × 6", () => {
  logSession("monday", "2026-09-07", {
    "monday-barbell-back-squat": { kg: 40, reps: [10, 10, 10] },
  });
  const t = targetFor("monday-barbell-back-squat", "2026-09-14");
  assert.equal(t.kg, 45);
  assert.equal(t.reps, 6);
  assert.match(t.reason, /all sets hit top of range/);
});

test("acceptance: bench 40 × 10/10/7 → 40 × 8 next Friday", () => {
  logSession("friday", "2026-09-04", {
    "friday-barbell-bench-press": { kg: 40, reps: [10, 10, 7] },
  });
  const t = targetFor("friday-barbell-bench-press", "2026-09-11");
  assert.equal(t.kg, 40);
  assert.equal(t.reps, 8);
  assert.equal(t.reason, "build reps first");
});

test("acceptance: pulldown stalled twice at 30 kg drops to 25 × 8", () => {
  logSession("friday", "2026-08-28", { "friday-lat-pulldown": { kg: 30, reps: [7, 6, 5] } });
  logSession("friday", "2026-09-04", { "friday-lat-pulldown": { kg: 30, reps: [7, 6, 5] } });
  const t = targetFor("friday-lat-pulldown", "2026-09-11");
  assert.equal(t.kg, 25);
  assert.equal(t.reps, 8);
  assert.equal(t.reason, "stalled twice → one step down");
});

test("a session where sets were left unticked does not move the weight", () => {
  logSession("monday", "2026-09-07", {
    "monday-barbell-back-squat": { kg: 45, reps: [10, 10] }, // only 2 of 3 ticked
  });
  const t = targetFor("monday-barbell-back-squat", "2026-09-08");
  assert.equal(t.kg, 40);
  assert.equal(t.reason, "first time");
  assert.equal(readLogs().sessions[0].status, "partial");
});

test("prefill carries the new target into the next session's rows", () => {
  logSession("monday", "2026-09-07", {
    "monday-barbell-back-squat": { kg: 40, reps: [10, 10, 10] },
  });
  const config = getConfig("monday-barbell-back-squat")!;
  const rows = makeRows(config, targetFor("monday-barbell-back-squat", "2026-09-14"));
  assert.deepEqual(rows.map((r) => [r.kg, r.reps]), [[45, 6], [45, 6], [45, 6]]);
});

// ------------------------------------------------------------------- drafts ---

test("a draft in progress keeps hand edits and ticks across a reload", () => {
  const config = getConfig("monday-leg-press")!;
  const target = targetFor("monday-leg-press");
  const rows = makeRows(config, target);
  rows[0] = { ...rows[0], kg: 55, kgEdited: true, done: true };
  lsSet(keys.setlog("2026-09-07", "monday-leg-press"), rows);

  const back = normalizeRows(lsGet(keys.setlog("2026-09-07", "monday-leg-press"), null), config, target);
  assert.equal(back[0].kg, 55);
  assert.equal(back[0].done, true);
  assert.equal(back[1].kg, 40); // untouched rows still hold the target
});

test("a pre-v1 draft ({ w, r }) is read, not thrown away", () => {
  const config = getConfig("monday-leg-press")!;
  const target = targetFor("monday-leg-press");
  lsSet(keys.setlog("2026-09-07", "monday-leg-press"), [
    { w: 60, r: 11, done: true },
    { w: 0, r: 0, done: false },
  ]);
  const rows = normalizeRows(lsGet(keys.setlog("2026-09-07", "monday-leg-press"), null), config, target);
  assert.equal(rows[0].kg, 60);
  assert.equal(rows[0].reps, 11);
  assert.equal(rows[0].done, true);
  assert.equal(rows[1].kg, 40, "an empty old row falls back to the target, not 0");
  assert.equal(rows[1].reps, 10);
});

// ------------------------------------------------------- §5 planned / missed ---

test("day states: done, partial, missed, planned, rest", () => {
  logSession("monday", "2026-09-07", {
    "monday-barbell-back-squat": { kg: 40, reps: [10, 10] }, // partial
  });
  const store = readLogs();
  const today = "2026-09-09"; // a Wednesday
  assert.equal(dayState(store, "2026-09-07", today), "partial");
  assert.equal(dayState(store, "2026-09-08", today), "missed");
  assert.equal(dayState(store, "2026-09-09", today), "planned");
  assert.equal(dayState(store, "2026-09-04", today), "missed"); // Friday
  assert.equal(dayState(store, "2026-09-05", today), "rest"); // Saturday
  assert.equal(dayState(store, "2026-09-06", today), "rest"); // Sunday
});

test("month stats count planned, done and missed days", () => {
  logSession("monday", "2026-09-07", {
    "monday-barbell-back-squat": { kg: 40, reps: [10, 10, 10] },
    "monday-romanian-deadlift-rdl": { kg: 30, reps: [10, 10, 10] },
  });
  const keysOfSept = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08"];
  const s = statsFor(readLogs(), keysOfSept, "2026-09-09");
  assert.equal(s.planned, 6); // Sep 5 and 6 are Sat/Sun
  assert.equal(s.partial, 1); // the squat + RDL session is not the whole day
  assert.equal(s.missed, 5);
  assert.equal(s.volumeKg, 40 * 30 + 30 * 30);
});

test("a make-up logs under the original day with the day it was actually trained", () => {
  // Monday's Lower A, trained on the Saturday of the same week.
  logSession("monday", "2026-09-12", {
    "monday-barbell-back-squat": { kg: 40, reps: [10, 10, 10] },
  });
  const session = readLogs().sessions[0];
  assert.equal(session.dayId, "monday");
  assert.equal(session.date, "2026-09-12");
  assert.equal(sessionVolumeKg(session), 40 * 30);
  // and the history reaches the engine under Monday's exercise id
  assert.equal(historyFor(readLogs(), "monday-barbell-back-squat").length, 1);
});

// ------------------------------------------------------------------ strength ---

test("the strength series takes the best set of each session", () => {
  logSession("monday", "2026-08-31", { "monday-barbell-back-squat": { kg: 40, reps: [8, 8, 8] } });
  logSession("monday", "2026-09-07", { "monday-barbell-back-squat": { kg: 45, reps: [8, 8, 6] } });
  const series = strengthSeries(readLogs(), "monday-barbell-back-squat");
  assert.equal(series.length, 2);
  assert.deepEqual(series.map((p) => p.kg), [40, 45]);
  assert.equal(series[1].reps, 8);
  assert.equal(series[1].e1rm, 57); // 45 × (1 + 8/30)
});

// ------------------------------------------------------------ export / import ---

test("acceptance: export → import round-trips exactly", () => {
  logSession("monday", "2026-09-07", {
    "monday-barbell-back-squat": { kg: 40, reps: [10, 10, 10] },
    "monday-leg-press": { kg: 40, reps: [12, 12, 11] },
  });
  updateLogs((s) => ({ ...s, overrides: { "monday-leg-press": { kg: 55 } }, settings: { allow125: true } }));

  const before = readLogs();
  const file = exportLogs(before);

  cells.clear();
  assert.equal(readLogs().sessions.length, 0);

  const result = importLogs(file);
  assert.equal(result.ok, true);
  assert.deepEqual(readLogs(), before);
});

test("importing rubbish is refused and leaves the log alone", () => {
  logSession("monday", "2026-09-07", { "monday-barbell-back-squat": { kg: 40, reps: [10, 10, 10] } });
  const before = readLogs();
  assert.equal(importLogs("not json at all").ok, false);
  assert.equal(importLogs('{"sessions":[]}').ok, false);
  assert.deepEqual(readLogs(), before);
});

test("a corrupted store degrades to empty instead of throwing", () => {
  lsSet(keys.logs, { sessions: "nonsense", overrides: 7, settings: null });
  const store = readLogs();
  assert.deepEqual(store.sessions, []);
  assert.equal(store.settings.allow125, false);
  assert.deepEqual(normalizeStore(undefined).sessions, []);
  assert.deepEqual(normalizeStore("💥").overrides, {});
});

// ----------------------------------------------------------------- migration ---

test("pre-v1 localStorage is migrated into coach:logs.v1", () => {
  lsSet(keys.sessions, {
    "2026-09-07": { dayId: "monday", completedSets: 19, durationMin: 62, volumeKg: 3000 },
  });
  lsSet(keys.log("monday-barbell-back-squat"), [
    { date: "2026-09-07", sets: [{ w: 40, r: 10 }, { w: 40, r: 10 }, { w: 40, r: 10 }] },
  ]);

  const moved = migrateLegacyLogs(week, (id) => getConfig(id)?.sets ?? 0);
  assert.equal(moved, true);

  const store = readLogs();
  assert.equal(store.sessions.length, 1);
  assert.equal(store.sessions[0].status, "done");
  assert.equal(
    Math.round((store.sessions[0].finishedAt - store.sessions[0].startedAt) / 60_000),
    62,
  );
  assert.equal(historyFor(store, "monday-barbell-back-squat")[0].sets.length, 3);

  // the migrated history feeds the engine straight away
  assert.equal(targetFor("monday-barbell-back-squat", "2026-09-14").kg, 45);
  // and it only runs once
  assert.equal(migrateLegacyLogs(week, () => 3), false);
});
