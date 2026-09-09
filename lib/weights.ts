// Starting-weight config (data/starting-weights.json) — the coach's per-exercise
// load, rep range and progression step. Keyed by the exercise ids in plan.json.
//
// `kg` means: barbell / machine / cable → TOTAL load on the bar or stack;
// dumbbell → PER HAND; assisted → the ASSISTANCE weight (progression lowers it).

import raw from "@/data/starting-weights.json";

export type LoadType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "time"
  | "assisted"
  | "superset";

/** One half of a superset — logged as its own set row. */
export interface PartConfig {
  name: string;
  type: LoadType;
  kg: number;
  reps: number;
  repMin: number;
  repMax: number;
  step: number;
  note?: string;
}

export interface ExerciseConfig {
  type: LoadType;
  /** Load in kg. Absent on `time` entries. */
  kg?: number;
  /** Hold length for `time` entries, in seconds. */
  seconds?: number;
  sets: number;
  reps?: number;
  repMin?: number;
  repMax?: number;
  /** kg added when progression fires (seconds for `time`). */
  step: number;
  note?: string;
  parts?: PartConfig[];
}

export interface WeightsMeta {
  athlete: string;
  basis: string;
  kgMeaning: string;
  progressionRule: string;
  defaultRepsRule: string;
}

const table = raw as unknown as Record<string, ExerciseConfig | WeightsMeta>;

export const weightsMeta = table._meta as WeightsMeta;

/** Every configured exercise id (keys starting with "_" are metadata, not exercises). */
export const CONFIG_IDS: string[] = Object.keys(table).filter(
  (k) => !k.startsWith("_"),
);

export const weightsConfig: Record<string, ExerciseConfig> = Object.fromEntries(
  CONFIG_IDS.map((id) => [id, table[id] as ExerciseConfig]),
);

export function getConfig(exerciseId: string): ExerciseConfig | undefined {
  return weightsConfig[exerciseId];
}

/** Types whose "load" is not a weight the user picks. */
export function isLoadless(type: LoadType): boolean {
  return type === "bodyweight" || type === "time";
}

/** Unit label for the second input column. */
export function repUnit(type: LoadType): string {
  return type === "time" ? "SEC" : "REPS";
}

/**
 * Coach's fallback when an exercise has no config: derive a sane default from
 * the plan's "3 × 8–12" string. (Every id in plan.json is configured today —
 * this only guards a future exercise being added to the plan first.)
 */
export function fallbackConfig(
  sets: number,
  repLow: number | null,
  repHigh: number | null,
): ExerciseConfig {
  const lo = repLow ?? 8;
  const hi = repHigh ?? lo;
  return {
    type: "machine",
    kg: 0,
    sets,
    reps: defaultReps(lo, hi),
    repMin: lo,
    repMax: hi,
    step: 2.5,
  };
}

/** _meta.defaultRepsRule: 6-10 / 8-12 → 8; 10-12 → 10; 12-15 → 12; 10-15 → 12. */
export function defaultReps(repMin: number, repMax: number): number {
  if (repMin <= 8) return 8;
  if (repMin >= 12) return 12;
  return repMax >= 15 ? 12 : repMin; // 10–12 → 10, 10–15 → 12
}

/** "6–10" / "8" — the rep range as shown in the prescription line. */
export function repRangeLabel(c: {
  repMin?: number;
  repMax?: number;
}): string {
  if (c.repMin == null) return "";
  if (c.repMax == null || c.repMax === c.repMin) return `${c.repMin}`;
  return `${c.repMin}–${c.repMax}`;
}
