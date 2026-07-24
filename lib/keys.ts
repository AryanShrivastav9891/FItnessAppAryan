// Central registry of localStorage keys (all auto-namespaced "coach:" by storage.ts).
// Keep every key in one place so the dashboard and workout screens never drift.

export const keys = {
  sessions: "sessions", // SessionsMap
  measurements: "measurements", // Measurement[]
  dietMode: "dietMode", // "regular" | "veg"

  log: (exerciseId: string) => `log:${exerciseId}`, // LoggedSession[]
  setlog: (date: string, exerciseId: string) => `setlog:${date}:${exerciseId}`, // LoggedSet[]
  warmup: (date: string) => `wu:${date}`, // string[] of checked ids
  stretch: (date: string) => `st:${date}`, // string[] of checked ids
  start: (date: string, dayId: string) => `start:${date}:${dayId}`, // session start ms
  water: (date: string) => `water:${date}`, // number of glasses
  creatine: (date: string) => `creatine:${date}`, // boolean
  sleep: (date: string) => `sleep:${date}`, // boolean (Neend 11:30)
} as const;
