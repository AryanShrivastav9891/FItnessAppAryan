// The in-progress rows of one exercise card: what the set logger shows before
// the session is finished and written into the log. Pure, so the row maths is
// shared by the card, the header count and the finish summary.

import type { ExerciseConfig } from "./weights";
import type { Target } from "./progression";
import type { LogSet } from "./logs";

export interface DraftSet {
  kg: number;
  /** Reps, or seconds for a `time` hold — the log stores both in this column. */
  reps: number;
  done: boolean;
  /** Which of the exercise's sets this row is (0-based). */
  setIndex: number;
  /** 0 | 1 for the two halves of a superset. */
  part?: number;
  /** The user typed a weight here, so auto-fill from set 1 must leave it alone. */
  kgEdited?: boolean;
  repsEdited?: boolean;
}

const isSuperset = (c: ExerciseConfig) => c.type === "superset" && !!c.parts?.length;

/** How many input rows the card renders (a superset shows both halves). */
export function rowCount(config: ExerciseConfig): number {
  return isSuperset(config) ? config.sets * 2 : config.sets;
}

/**
 * Sets counted towards "Lift 0/19". A superset set only counts once BOTH halves
 * are ticked, which is what keeps Friday at 21 sets rather than 24.
 */
export function doneSetCount(rows: DraftSet[], config: ExerciseConfig): number {
  if (!isSuperset(config)) return rows.filter((r) => r.done).length;
  let n = 0;
  for (let i = 0; i < config.sets; i++) {
    if (rows.find((r) => r.part === 0 && r.setIndex === i)?.done &&
        rows.find((r) => r.part === 1 && r.setIndex === i)?.done) n += 1;
  }
  return n;
}

/** Prescribed sets for the header maths — a superset set is one set. */
export function prescribedSetCount(config: ExerciseConfig): number {
  return config.sets;
}

/** §2 — every row starts at the current target. Nothing is ever 0 kg / 0 reps. */
export function makeRows(config: ExerciseConfig, target: Target): DraftSet[] {
  if (isSuperset(config) && config.parts) {
    const rows: DraftSet[] = [];
    for (let i = 0; i < config.sets; i++) {
      config.parts.forEach((p, pi) => {
        const t = target.parts?.[pi];
        rows.push({
          kg: t?.kg ?? p.kg,
          reps: t?.reps ?? p.reps,
          done: false,
          part: pi,
          setIndex: i,
        });
      });
    }
    return rows;
  }
  const reps = target.seconds ?? target.reps;
  return Array.from({ length: config.sets }, (_, i) => ({
    kg: target.kg,
    reps,
    done: false,
    setIndex: i,
  }));
}

/**
 * Reconcile whatever is in storage with the rows the card needs now: keeps the
 * user's edits and ticks, re-prefills anything missing, and understands the
 * pre-v1 draft shape ({ w, r }) so a session in progress survives the update.
 */
export function normalizeRows(
  saved: unknown,
  config: ExerciseConfig,
  target: Target,
): DraftSet[] {
  const fresh = makeRows(config, target);
  if (!Array.isArray(saved)) return fresh;

  const old = saved as Record<string, unknown>[];
  return fresh.map((row, i) => {
    // Match on (part, setIndex) when present, else fall back to position.
    const prev =
      old.find(
        (o) =>
          (o.part ?? null) === (row.part ?? null) &&
          typeof o.setIndex === "number" &&
          o.setIndex === row.setIndex,
      ) ?? old[i];
    if (!prev) return row;

    const kg = numOr(prev.kg, numOr(prev.w, NaN));
    const reps = numOr(prev.reps, numOr(prev.r, NaN));
    return {
      ...row,
      kg: Number.isFinite(kg) && (prev.kgEdited === true || prev.done === true || kg > 0) ? kg : row.kg,
      reps: Number.isFinite(reps) && (prev.repsEdited === true || prev.done === true || reps > 0) ? reps : row.reps,
      done: prev.done === true,
      kgEdited: prev.kgEdited === true,
      repsEdited: prev.repsEdited === true,
    };
  });
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Strip the UI-only flags before the rows go into the log. */
export function toLogSets(rows: DraftSet[]): LogSet[] {
  return rows.map((r) => {
    const out: LogSet = { kg: r.kg, reps: r.reps, done: r.done };
    if (r.part != null) out.part = r.part;
    return out;
  });
}

/** Done-set count straight from raw storage — used by the header and day cards. */
export function countDoneRaw(saved: unknown, config: ExerciseConfig): number {
  if (!Array.isArray(saved)) return 0;
  const rows = saved as Partial<DraftSet>[];
  if (!isSuperset(config)) return rows.filter((r) => r.done).length;
  let n = 0;
  for (let i = 0; i < config.sets; i++) {
    const a = rows.find((r) => r.part === 0 && r.setIndex === i);
    const b = rows.find((r) => r.part === 1 && r.setIndex === i);
    if (a?.done && b?.done) n += 1;
  }
  return n;
}
