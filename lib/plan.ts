import planData from "@/data/plan.json";
import type { Day, DietMode, Plan } from "./types";

export const plan = planData as unknown as Plan;
export const week = plan.week;
export const DAY_IDS = plan.week.map((d) => d.id);

export function getDay(id: string): Day | undefined {
  return plan.week.find((d) => d.id === id);
}

/** Union of primary muscles trained on a day (in first-seen order). */
export function musclesForDay(day: Day): string[] {
  const seen = new Set<string>();
  for (const ex of day.exercises) {
    for (const m of ex.primary) seen.add(m);
  }
  return [...seen];
}

// Bento-style soft pastel plate colors
export const DAY_COLOR: Record<string, string> = {
  monday: "#ff6b6b", // soft red 25kg
  tuesday: "#4dabf7", // soft blue 20kg
  wednesday: "#ffd43b", // soft yellow 15kg
  thursday: "#51cf66", // soft green 10kg
  friday: "#e9ecef", // soft white 5kg
};

export const DAY_PLATE_KG: Record<string, string> = {
  monday: "25",
  tuesday: "20",
  wednesday: "15",
  thursday: "10",
  friday: "5",
};

export const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};

export function dayColor(id: string): string {
  return DAY_COLOR[id] ?? "#8B96A3";
}

// Self-check counts (used by /debug and dev assertions).
export const RENDER_COUNTS = {
  exercises: plan.week.reduce((n, d) => n + d.exercises.length, 0),
  warmups: plan.week.reduce((n, d) => n + d.warmup.length, 0),
  stretches: plan.week.reduce((n, d) => n + d.static.length, 0),
  meals: (Object.values(plan.diet) as { meals: unknown[] }[]).reduce(
    (n, d) => n + d.meals.length,
    0,
  ),
};

export const EXPECTED_COUNTS = {
  exercises: 34,
  warmups: 34,
  stretches: 31,
  meals: 12,
};

export const DIET_MODES: DietMode[] = ["regular", "veg"];
