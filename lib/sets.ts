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

// The progressive-overload decision now lives in lib/progression.ts, which reads
// the real rep range from starting-weights.json instead of the plan's prose.
