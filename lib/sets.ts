import type { LoggedSet } from "./types";

export interface ParsedSets {
  count: number; // number of logger rows
  repLow: number | null;
  repHigh: number | null;
  raw: string;
}

/**
 * Parse a coach "sets" string into a row count + rep range.
 * Handles: "3 × 6–10", "4 × 12–15", "3 × 10–12 per side",
 * "2 rounds × 30–40 steps", "Plank 3 × 30–45 sec + Side Plank 2 × 20–30 sec/side",
 * "3 × 10–12 each (back-to-back, phir rest)".
 */
export function parseSets(sets: string): ParsedSets {
  // Row count = the first integer in the string (e.g. "2 rounds ×", "Plank 3 ×").
  const firstNum = sets.match(/\d+/);
  let count = firstNum ? parseInt(firstNum[0], 10) : 1;
  count = Math.min(Math.max(count, 1), 10); // sane bounds for a set logger

  // Rep range = first "× N–M" (en-dash, em-dash, or hyphen).
  let repLow: number | null = null;
  let repHigh: number | null = null;
  const range = sets.match(/[×xX]\s*(\d+)\s*[–—-]\s*(\d+)/);
  if (range) {
    repLow = parseInt(range[1], 10);
    repHigh = parseInt(range[2], 10);
  } else {
    const single = sets.match(/[×xX]\s*(\d+)/);
    if (single) {
      repLow = repHigh = parseInt(single[1], 10);
    }
  }

  return { count, repLow, repHigh, raw: sets };
}

/**
 * Progressive-overload gate (coach's rule): every set of the LAST session was
 * logged with a real weight AND hit at/above the TOP of the rep range.
 */
export function qualifiesForOverload(
  lastSets: LoggedSet[] | undefined,
  repHigh: number | null,
): boolean {
  if (!lastSets || lastSets.length === 0 || repHigh == null) return false;
  return lastSets.every((s) => (s.w ?? 0) > 0 && (s.r ?? 0) >= repHigh);
}

export function sessionVolume(sets: LoggedSet[]): number {
  return sets.reduce((sum, s) => sum + (s.w ?? 0) * (s.r ?? 0), 0);
}
