// Central registry of localStorage keys (all auto-namespaced "coach:" by storage.ts).
// Keep every key in one place so the dashboard and workout screens never drift.

export const keys = {
  logs: "logs.v1", // LogStore — the workout log (lib/logs.ts)
  sessions: "sessions", // SessionsMap — legacy, migrated into logs.v1
  measurements: "measurements", // Measurement[]
  dietMode: "dietMode", // "regular" | "veg"
  offlineMode: "offlineMode", // boolean — the home screen's offline switch

  log: (exerciseId: string) => `log:${exerciseId}`, // LoggedSession[]
  setlog: (date: string, exerciseId: string) => `setlog:${date}:${exerciseId}`, // DraftSet[] in progress
  note: (date: string, exerciseId: string) => `note:${date}:${exerciseId}`, // per-exercise note
  warmup: (date: string) => `wu:${date}`, // string[] of checked ids
  stretch: (date: string) => `st:${date}`, // string[] of checked ids
  start: (date: string, dayId: string) => `start:${date}:${dayId}`, // session start ms
  water: (date: string) => `water:${date}`, // number of glasses
  creatine: (date: string) => `creatine:${date}`, // boolean
  sleep: (date: string) => `sleep:${date}`, // boolean (Neend 11:30)
} as const;
