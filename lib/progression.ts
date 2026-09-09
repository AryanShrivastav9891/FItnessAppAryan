// The progression engine. Pure — no localStorage, no clock, no React — so every
// branch is unit-testable (lib/progression.test.ts, `npm test`).
//
// The coach's rule, in one line: hit the top of the rep range on EVERY set and
// the weight goes up a step; fall under the bottom of the range twice at the
// same weight and it goes down a step; anything in between, add a rep.

import type { ExerciseConfig, LoadType, PartConfig } from "./weights";

// ---------------------------------------------------------------- history ---

export interface HistorySet {
  kg: number;
  reps: number;
  done: boolean;
  /** 0 | 1 for a superset's two halves; absent otherwise. */
  part?: number;
}

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  sets: HistorySet[];
}

// ----------------------------------------------------------------- result ---

export interface TargetPart {
  name: string;
  type: LoadType;
  kg: number;
  reps: number;
  step: number;
  reason: string;
  badge?: string;
}

export interface Target {
  /** Load in kg (assistance weight for `assisted`, 0 for bodyweight/time). */
  kg: number;
  /** Target reps per set (steps for the carry, 0 for `time`). */
  reps: number;
  /** Hold length for `time` exercises. */
  seconds?: number;
  reason: string;
  badge?: string;
  /** Present only for supersets — one target per half. */
  parts?: TargetPart[];
}

export interface TargetOptions {
  /** overrides[exerciseId].kg — a weight the user set by hand. */
  overrideKg?: number;
  /** settings.allow125 — the gym has 1.25 kg plates, so barbells round to 2.5. */
  allow125?: boolean;
}

export const COMEBACK_BADGE = "Comeback — go light, form first";

// ------------------------------------------------------------------ dates ---

/** Whole days from key `a` to key `b`, both YYYY-MM-DD. Negative if b is earlier. */
export function daysBetween(a: string, b: string): number {
  const ta = Date.parse(`${a}T12:00:00Z`);
  const tb = Date.parse(`${b}T12:00:00Z`);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
  return Math.round((tb - ta) / 86_400_000);
}

// ------------------------------------------------------------------ maths ---

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Nearest multiple of `inc`, halves rounded up (so 42.5 → 45 at inc 5). */
function roundTo(value: number, inc: number): number {
  if (!(inc > 0)) return round2(value);
  return round2(Math.round(round2(value / inc)) * inc);
}

/**
 * §4.4 — round a computed load to something that actually exists in the gym.
 * barbell → 5 kg (2.5 with 1.25s); dumbbell → 2.5; everything on a stack → step.
 */
export function roundToPlates(
  kg: number,
  type: LoadType,
  step: number,
  allow125 = false,
): number {
  switch (type) {
    case "barbell":
      return roundTo(kg, allow125 ? 2.5 : 5);
    case "dumbbell":
      return roundTo(kg, 2.5);
    case "machine":
    case "cable":
    case "assisted":
      return roundTo(kg, step > 0 ? step : 2.5);
    default:
      return round2(kg); // bodyweight / time carry no load
  }
}

/**
 * The session's working weight: the kg used on most sets (ties → the first set).
 * Direction-neutral, so it reads the same for `assisted`, where lighter is harder.
 */
export function workingKg(sets: HistorySet[]): number {
  if (!sets.length) return 0;
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(s.kg, (counts.get(s.kg) ?? 0) + 1);
  let best = sets[0].kg;
  let bestN = counts.get(best) ?? 0;
  for (const s of sets) {
    const n = counts.get(s.kg) ?? 0;
    if (n > bestN) {
      best = s.kg;
      bestN = n;
    }
  }
  return best;
}

function minReps(sets: HistorySet[]): number {
  return sets.reduce((m, s) => Math.min(m, s.reps), Infinity);
}

/** Estimated 1RM, Epley: kg × (1 + reps/30). */
export function epley(kg: number, reps: number): number {
  return round2(kg * (1 + reps / 30));
}

// -------------------------------------------------------------- selection ---

function setsOfPart(entry: HistoryEntry, part?: number): HistorySet[] {
  if (part == null) return entry.sets.filter((s) => s.part == null || s.part === 0);
  return entry.sets.filter((s) => s.part === part);
}

/**
 * A session counts as completed when every prescribed set was ticked done.
 * Extra sets are fine; missing or unticked ones are not.
 */
function completedSessions(
  history: HistoryEntry[],
  prescribed: number,
  part?: number,
): { date: string; sets: HistorySet[] }[] {
  const out: { date: string; sets: HistorySet[] }[] = [];
  for (const entry of history) {
    const sets = setsOfPart(entry, part);
    const done = sets.filter((s) => s.done);
    if (prescribed > 0 && done.length >= prescribed) {
      out.push({ date: entry.date, sets: done });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** §5 — how long since this exercise was last trained to completion. */
export function daysSinceLastCompletedSession(
  history: HistoryEntry[],
  prescribed: number,
  today: string,
  part?: number,
): number | null {
  const done = completedSessions(history, prescribed, part);
  const last = done[done.length - 1];
  return last ? daysBetween(last.date, today) : null;
}

// ------------------------------------------------------------------ core ----

interface CoreConfig {
  type: LoadType;
  kg: number;
  reps: number;
  repMin: number;
  repMax: number;
  step: number;
}

function coreOf(c: ExerciseConfig | PartConfig): CoreConfig {
  const repMin = c.repMin ?? c.reps ?? 8;
  const repMax = c.repMax ?? repMin;
  return {
    type: c.type,
    kg: c.kg ?? 0,
    reps: c.reps ?? repMin,
    repMin,
    repMax,
    step: c.step ?? 0,
  };
}

/**
 * The comeback floor (§5): after time off you never drop below where the plan
 * started you. For `assisted` the direction inverts — less assistance is
 * progress, so the start is a CEILING and 0 (the first unassisted pull-up) is
 * the floor.
 *
 * Note this floor is deliberately NOT applied to an earned step-down. A stall
 * means the starting estimate was too heavy ("find your weight", per the
 * config's _meta), so the weight must be free to go under it — that is the
 * pulldown case in the acceptance list: 30 kg stalled twice → 25 kg.
 */
function comebackFloor(kg: number, cfg: CoreConfig): number {
  if (cfg.type === "assisted") return Math.max(0, Math.min(kg, cfg.kg));
  return Math.max(kg, cfg.kg);
}

/** Progress moves the load up — except on an assisted machine, where it comes down. */
function applyStep(kg: number, cfg: CoreConfig, steps: number): number {
  const dir = cfg.type === "assisted" ? -1 : 1;
  return round2(kg + dir * steps * cfg.step);
}

/** Backing off (stall or comeback) is the opposite of progress. */
function backOff(kg: number, cfg: CoreConfig, steps: number): number {
  return applyStep(kg, cfg, -steps);
}

function stepLabel(cfg: CoreConfig): string {
  const unit = cfg.type === "time" ? "s" : "kg";
  return `${cfg.step}${unit}`;
}

function computeOne(
  history: HistoryEntry[],
  raw: ExerciseConfig | PartConfig,
  prescribed: number,
  today: string,
  opts: TargetOptions,
  part?: number,
): { kg: number; reps: number; reason: string; badge?: string } {
  const cfg = coreOf(raw);
  const done = completedSessions(history, prescribed, part);
  const last = done[done.length - 1];

  // §4.1 — nothing logged yet: the config is the plan.
  if (!last) {
    return { kg: cfg.kg, reps: cfg.reps, reason: "first time" };
  }

  // §4.5 — a hand-set weight replaces the logged one as the basis.
  const lastKg = opts.overrideKg ?? workingKg(last.sets);
  const low = minReps(last.sets);

  let kg: number;
  let reps: number;
  let reason: string;

  if (low >= cfg.repMax && cfg.step === 0) {
    // Nothing to add (bodyweight) — the movement itself has to get harder.
    kg = lastKg;
    reps = cfg.repMax;
    reason = "all sets hit top of range → make the movement harder";
  } else if (low >= cfg.repMax) {
    kg = applyStep(lastKg, cfg, 1);
    reps = cfg.repMin;
    reason =
      cfg.type === "assisted"
        ? `all sets hit top of range → −${stepLabel(cfg)} assist`
        : `all sets hit top of range → +${stepLabel(cfg)}`;
  } else if (low < cfg.repMin && stalledBefore(done, cfg, workingKg(last.sets))) {
    kg = backOff(lastKg, cfg, 1);
    reps = cfg.repMin;
    reason = "stalled twice → one step down";
  } else {
    kg = lastKg;
    reps = Math.min(cfg.repMax, Math.max(cfg.repMin, low + 1));
    reason = "build reps first";
  }

  // §5 — comeback. Time away outranks whatever the reps said: come back under
  // the last working weight, at the bottom of the range.
  let badge: string | undefined;
  const away = daysBetween(last.date, today);
  const steps = away > 21 ? 2 : away > 10 ? 1 : 0;
  if (steps > 0) {
    kg = backOff(lastKg, cfg, steps);
    reps = cfg.repMin;
    badge = COMEBACK_BADGE;
    reason = `${away} days off — ${steps === 2 ? "two steps" : "one step"} back, form first`;
  }

  // §4.4 — plate reality. A comeback additionally cannot go under the start.
  kg = roundToPlates(kg, cfg.type, cfg.step, opts.allow125);
  kg = steps > 0 ? comebackFloor(kg, cfg) : Math.max(0, kg);

  if (cfg.type === "bodyweight") kg = cfg.kg; // reps only
  return { kg, reps, reason, badge };
}

/** The stall rule needs the PREVIOUS completed session to be at the same kg too. */
function stalledBefore(
  done: { date: string; sets: HistorySet[] }[],
  cfg: CoreConfig,
  loggedLastKg: number,
): boolean {
  const prev = done[done.length - 2];
  if (!prev) return false;
  if (workingKg(prev.sets) !== loggedLastKg) return false;
  return minReps(prev.sets) < cfg.repMin;
}

/**
 * `time` holds have no reps and no load — the hold itself is what progresses.
 * Finish the prescribed sets and the next target is `step` seconds longer.
 */
function computeTime(
  history: HistoryEntry[],
  cfg: ExerciseConfig,
  today: string,
): Target {
  const start = cfg.seconds ?? 30;
  const done = completedSessions(history, cfg.sets);
  const last = done[done.length - 1];
  if (!last) {
    return { kg: 0, reps: 0, seconds: start, reason: "first time" };
  }

  const held = minReps(last.sets); // seconds are logged in the reps column
  const away = daysBetween(last.date, today);
  const steps = away > 21 ? 2 : away > 10 ? 1 : 0;

  if (steps > 0) {
    return {
      kg: 0,
      reps: 0,
      seconds: Math.max(start, held - steps * cfg.step),
      reason: `${away} days off — ${steps === 2 ? "two steps" : "one step"} back, form first`,
      badge: COMEBACK_BADGE,
    };
  }
  return {
    kg: 0,
    reps: 0,
    seconds: Math.max(start, held + cfg.step),
    reason: `held the full time → +${cfg.step}s`,
  };
}

// ------------------------------------------------------------------- API ----

/**
 * What to load on the bar today.
 *
 * @param exerciseId  plan.json exercise id (carried through for callers/logging)
 * @param history     every logged session for this exercise, any order
 * @param config      that exercise's entry in data/starting-weights.json
 * @param today       YYYY-MM-DD
 */
export function nextTarget(
  exerciseId: string,
  history: HistoryEntry[],
  config: ExerciseConfig,
  today: string,
  options: TargetOptions = {},
): Target {
  const hist = history ?? [];

  if (config.type === "time") return computeTime(hist, config, today);

  if (config.type === "superset" && config.parts?.length) {
    const parts: TargetPart[] = config.parts.map((p, i) => {
      const r = computeOne(hist, p, config.sets, today, options, i);
      return {
        name: p.name,
        type: p.type,
        kg: r.kg,
        reps: r.reps,
        step: p.step,
        reason: r.reason,
        badge: r.badge,
      };
    });
    return {
      kg: parts[0].kg,
      reps: parts[0].reps,
      reason: parts.map((p) => `${p.name}: ${p.reason}`).join(" · "),
      badge: parts.find((p) => p.badge)?.badge,
      parts,
    };
  }

  const r = computeOne(hist, config, config.sets, today, options);

  // The one milestone worth calling out: assistance is gone.
  if (config.type === "assisted" && r.kg === 0) {
    return { ...r, badge: "No assist left — try a real pull-up" };
  }
  return r;
}

/** Human-readable target line: "40 × 10, 10, 10" style prefill for `sets` rows. */
export function targetRow(t: Target, sets: number): string {
  if (t.seconds != null) return `${t.seconds}s × ${sets}`;
  return `${t.kg} × ${Array(sets).fill(t.reps).join(", ")}`;
}

