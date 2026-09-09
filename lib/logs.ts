// The workout log — one versioned record under coach:logs.v1, per the spec's
// storage shape. Everything the app knows about what was actually lifted lives
// here; /week, /progress and the progression engine all read from it, so there
// is exactly one source of truth and it round-trips through Export/Import.

import { lsGet, lsSet } from "./storage";
import { keys } from "./keys";
import {
  dayIdForKey,
  isWeekendKey,
  monthKeysUpTo,
  recentDayKeys,
  weekStripKeys,
} from "./date";
import { epley, type HistoryEntry } from "./progression";
import type { SessionSummary, SessionsMap } from "./types";

export interface LogSet {
  kg: number;
  reps: number;
  done: boolean;
  /** 0 | 1 for the two halves of a superset. */
  part?: number;
}

export interface LogExercise {
  exerciseId: string;
  sets: LogSet[];
  note?: string;
}

export type SessionStatus = "done" | "partial";

export interface LogSession {
  id: string;
  date: string; // YYYY-MM-DD — the day it was actually trained
  dayId: string; // 'monday'…'friday' — the plan day, even on a make-up
  startedAt: number;
  finishedAt: number;
  status: SessionStatus;
  exercises: LogExercise[];
}

export interface LogStore {
  version: 1;
  sessions: LogSession[];
  overrides: Record<string, { kg: number }>;
  settings: { allow125: boolean };
}

export const EMPTY_STORE: LogStore = {
  version: 1,
  sessions: [],
  overrides: {},
  settings: { allow125: false },
};

// ------------------------------------------------------------- validation ---

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function cleanSet(raw: unknown): LogSet | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const set: LogSet = {
    kg: Math.max(0, num(s.kg)),
    reps: Math.max(0, num(s.reps)),
    done: s.done === true,
  };
  if (s.part === 0 || s.part === 1) set.part = s.part;
  return set;
}

function cleanSession(raw: unknown): LogSession | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.date !== "string" || typeof s.dayId !== "string") return null;
  const exercises: LogExercise[] = Array.isArray(s.exercises)
    ? (s.exercises as unknown[]).flatMap((e) => {
        if (!e || typeof e !== "object") return [];
        const ex = e as Record<string, unknown>;
        if (typeof ex.exerciseId !== "string") return [];
        const sets = Array.isArray(ex.sets)
          ? (ex.sets as unknown[]).map(cleanSet).filter((x): x is LogSet => x != null)
          : [];
        const out: LogExercise = { exerciseId: ex.exerciseId, sets };
        if (typeof ex.note === "string" && ex.note.trim()) out.note = ex.note;
        return [out];
      })
    : [];
  return {
    id: typeof s.id === "string" ? s.id : `${s.date}-${s.dayId}`,
    date: s.date,
    dayId: s.dayId,
    startedAt: num(s.startedAt),
    finishedAt: num(s.finishedAt),
    status: s.status === "done" ? "done" : "partial",
    exercises,
  };
}

/**
 * Parse anything into a usable store. Corrupt or half-written data degrades to
 * the empty store rather than throwing — offline, a crash here would lock the
 * user out of their own log.
 */
export function normalizeStore(raw: unknown): LogStore {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STORE };
  const r = raw as Record<string, unknown>;
  const sessions = Array.isArray(r.sessions)
    ? (r.sessions as unknown[])
        .map(cleanSession)
        .filter((x): x is LogSession => x != null)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const overrides: Record<string, { kg: number }> = {};
  if (r.overrides && typeof r.overrides === "object") {
    for (const [id, v] of Object.entries(r.overrides as Record<string, unknown>)) {
      const kg = num((v as Record<string, unknown>)?.kg, NaN);
      if (Number.isFinite(kg) && kg >= 0) overrides[id] = { kg };
    }
  }

  const settings = (r.settings ?? {}) as Record<string, unknown>;
  return {
    version: 1,
    sessions,
    overrides,
    settings: { allow125: settings.allow125 === true },
  };
}

// ---------------------------------------------------------------- read/write ---

export function readLogs(): LogStore {
  return normalizeStore(lsGet<unknown>(keys.logs, null));
}

export function writeLogs(store: LogStore): void {
  lsSet(keys.logs, store);
}

export function updateLogs(fn: (store: LogStore) => LogStore): LogStore {
  const next = fn(readLogs());
  writeLogs(next);
  return next;
}

// ------------------------------------------------------------------ queries ---

/** Every logged session for one exercise, as the progression engine wants it. */
export function historyFor(store: LogStore, exerciseId: string): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const s of store.sessions) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex && ex.sets.length) out.push({ date: s.date, sets: ex.sets });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export interface LastEntry {
  date: string;
  sets: LogSet[];
  note?: string;
}

/** The most recent session that logged this exercise at all (done or not). */
export function lastEntryFor(store: LogStore, exerciseId: string): LastEntry | null {
  for (let i = store.sessions.length - 1; i >= 0; i--) {
    const s = store.sessions[i];
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex && ex.sets.some((x) => x.done)) {
      return { date: s.date, sets: ex.sets.filter((x) => x.done), note: ex.note };
    }
  }
  return null;
}

export function sessionVolumeKg(session: LogSession): number {
  let v = 0;
  for (const ex of session.exercises) {
    for (const s of ex.sets) if (s.done) v += s.kg * s.reps;
  }
  return v;
}

export function doneSetCount(session: LogSession): number {
  return session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.done).length,
    0,
  );
}

/** Legacy-shaped map keyed by date — what the week strip and stat tiles read. */
export function sessionsMap(store: LogStore): SessionsMap {
  const map: SessionsMap = {};
  for (const s of store.sessions) {
    const summary: SessionSummary = {
      dayId: s.dayId,
      completedSets: doneSetCount(s),
      durationMin:
        s.finishedAt > s.startedAt
          ? Math.max(1, Math.round((s.finishedAt - s.startedAt) / 60000))
          : 0,
      volumeKg: sessionVolumeKg(s),
    };
    map[s.date] = summary;
  }
  return map;
}

export function sessionOn(store: LogStore, dateKey: string): LogSession | undefined {
  return store.sessions.find((s) => s.date === dateKey);
}

// ------------------------------------------------------- planned / missed ---

export type DayState = "done" | "partial" | "missed" | "planned" | "rest";

/**
 * §5 — planned days are Mon–Fri. A planned day in the past with no session is
 * missed; today stays "planned" until it is trained.
 */
export function dayState(
  store: LogStore,
  dateKey: string,
  today: string,
): DayState {
  const session = sessionOn(store, dateKey);
  if (session) return session.status === "done" ? "done" : "partial";
  if (isWeekendKey(dateKey)) return "rest";
  if (today && dateKey < today) return "missed";
  return "planned";
}

export interface PeriodStats {
  planned: number;
  done: number;
  partial: number;
  missed: number;
  volumeKg: number;
}

export function statsFor(
  store: LogStore,
  dayKeys: string[],
  today: string,
): PeriodStats {
  const out: PeriodStats = { planned: 0, done: 0, partial: 0, missed: 0, volumeKg: 0 };
  for (const key of dayKeys) {
    if (dayIdForKey(key)) out.planned += 1;
    const state = dayState(store, key, today);
    if (state === "done") out.done += 1;
    else if (state === "partial") out.partial += 1;
    else if (state === "missed") out.missed += 1;
    const s = sessionOn(store, key);
    if (s) out.volumeKg += sessionVolumeKg(s);
  }
  return out;
}

export function weekStats(store: LogStore, today: string): PeriodStats {
  return statsFor(store, weekStripKeys(), today);
}

export function monthStats(store: LogStore, today: string): PeriodStats {
  return statsFor(store, monthKeysUpTo(today), today);
}

/**
 * The state of a PLAN day (Monday's Lower A) rather than a calendar date — a
 * make-up trained on Saturday still logs under `dayId`, so it counts here.
 */
export function planDayState(
  store: LogStore,
  dayId: string,
  today: string,
): DayState {
  const week = weekStripKeys();
  const session = store.sessions.find((s) => s.dayId === dayId && week.includes(s.date));
  if (session) return session.status === "done" ? "done" : "partial";
  const planned = week.find((k) => dayIdForKey(k) === dayId);
  if (planned && today && planned < today) return "missed";
  return "planned";
}

/** Consecutive planned days trained. Weekends are skipped, not breaks. */
export function currentStreak(store: LogStore, today: string): number {
  const days = recentDayKeys(180);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const key = days[i];
    if (!dayIdForKey(key)) continue; // rest day — neither breaks nor extends
    if (sessionOn(store, key)) {
      streak += 1;
      continue;
    }
    if (key === today) continue; // today is not missed until it is over
    break;
  }
  return streak;
}

/** Missed planned days in the current week, oldest first — the make-up list. */
export function missedThisWeek(store: LogStore, today: string): string[] {
  return weekStripKeys().filter((k) => dayState(store, k, today) === "missed");
}

/** This week's real volume for one plan day (0 if it was not trained). */
export function weekVolumeByDayId(store: LogStore, today: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of weekStripKeys()) {
    if (key > today) continue;
    const s = sessionOn(store, key);
    if (s) out[s.dayId] = (out[s.dayId] ?? 0) + sessionVolumeKg(s);
  }
  return out;
}

/** Monday's key for the week containing `key` — used to group weekly volume. */
export function mondayOf(key: string): string {
  const t = Date.parse(`${key}T12:00:00Z`);
  const wd = new Date(t).getUTCDay();
  const dt = new Date(t - ((wd + 6) % 7) * 86_400_000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** Highest weekly total volume ever logged. */
export function bestWeekVolume(store: LogStore): number {
  const byWeek: Record<string, number> = {};
  for (const s of store.sessions) {
    const wk = mondayOf(s.date);
    byWeek[wk] = (byWeek[wk] ?? 0) + sessionVolumeKg(s);
  }
  return Object.values(byWeek).reduce((m, v) => Math.max(m, v), 0);
}

// ------------------------------------------------------------------ strength ---

export interface StrengthPoint {
  date: string;
  kg: number; // best working set of that session
  reps: number;
  e1rm: number;
}

/** Best-set kg per session + estimated 1RM, oldest first. */
export function strengthSeries(store: LogStore, exerciseId: string): StrengthPoint[] {
  const points: StrengthPoint[] = [];
  for (const s of store.sessions) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const done = ex.sets.filter((x) => x.done && x.kg > 0 && x.reps > 0);
    if (!done.length) continue;
    const best = done.reduce((a, b) => (epley(b.kg, b.reps) > epley(a.kg, a.reps) ? b : a));
    points.push({
      date: s.date,
      kg: best.kg,
      reps: best.reps,
      e1rm: epley(best.kg, best.reps),
    });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

// ------------------------------------------------------------ import/export ---

export function exportLogs(store: LogStore = readLogs()): string {
  return JSON.stringify({ app: "coach", exportedAt: new Date().toISOString(), ...store }, null, 2);
}

export interface ImportResult {
  ok: boolean;
  message: string;
  sessions?: number;
}

/** Replaces the store with a previously exported file. */
export function importLogs(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "That file is not valid JSON." };
  }
  const store = normalizeStore(parsed);
  if (!store.sessions.length && !Object.keys(store.overrides).length) {
    return { ok: false, message: "No sessions found in that file." };
  }
  writeLogs(store);
  return { ok: true, message: `Imported ${store.sessions.length} sessions.`, sessions: store.sessions.length };
}

// ---------------------------------------------------------------- overrides ---

export function setOverride(exerciseId: string, kg: number): void {
  updateLogs((s) => ({ ...s, overrides: { ...s.overrides, [exerciseId]: { kg } } }));
}

/** §4.5 — an override is consumed once the session it applied to is logged. */
export function clearOverrides(exerciseIds: string[]): void {
  updateLogs((s) => {
    const overrides = { ...s.overrides };
    for (const id of exerciseIds) delete overrides[id];
    return { ...s, overrides };
  });
}

export function setAllow125(allow125: boolean): void {
  updateLogs((s) => ({ ...s, settings: { ...s.settings, allow125 } }));
}

// ------------------------------------------------------------------ migration ---

interface LegacySet {
  w?: number;
  r?: number;
}
interface LegacyEntry {
  date?: string;
  sets?: LegacySet[];
}

/**
 * One-time lift of the pre-v1 keys (coach:sessions + coach:log:<exerciseId>)
 * into coach:logs.v1, so an install that already has weeks of training in it
 * keeps its history — and its streak — after the update.
 *
 * The old records only stored sets that were ticked, so every migrated set is
 * marked done; a migrated session is "done" when the old summary counted at
 * least as many sets as the day prescribes.
 */
export function migrateLegacyLogs(
  days: { id: string; exercises: { id: string }[] }[],
  prescribedSets: (exerciseId: string) => number,
): boolean {
  if (typeof window === "undefined") return false;
  if (lsGet<unknown>(keys.logs, null) != null) return false;

  const legacy = lsGet<SessionsMap>(keys.sessions, {});
  const dates = Object.keys(legacy);
  if (!dates.length) return false;

  // date -> exerciseId -> sets
  const byDate = new Map<string, Map<string, LogSet[]>>();
  for (const day of days) {
    for (const ex of day.exercises) {
      for (const entry of lsGet<LegacyEntry[]>(keys.log(ex.id), [])) {
        if (!entry?.date || !Array.isArray(entry.sets)) continue;
        const sets = entry.sets.map((s) => ({
          kg: Math.max(0, num(s?.w)),
          reps: Math.max(0, num(s?.r)),
          done: true,
        }));
        if (!sets.length) continue;
        if (!byDate.has(entry.date)) byDate.set(entry.date, new Map());
        byDate.get(entry.date)!.set(ex.id, sets);
      }
    }
  }

  const sessions: LogSession[] = dates.sort().map((date) => {
    const summary = legacy[date];
    const day = days.find((d) => d.id === summary.dayId);
    const logged = byDate.get(date) ?? new Map<string, LogSet[]>();
    const exercises: LogExercise[] = (day?.exercises ?? []).flatMap((ex) => {
      const sets = logged.get(ex.id);
      return sets ? [{ exerciseId: ex.id, sets }] : [];
    });
    const total = (day?.exercises ?? []).reduce((n, ex) => n + prescribedSets(ex.id), 0);
    const finishedAt = Date.parse(`${date}T20:00:00+05:30`) || 0;
    return {
      id: `${date}-${summary.dayId}`,
      date,
      dayId: summary.dayId,
      startedAt: finishedAt - Math.max(1, summary.durationMin || 45) * 60_000,
      finishedAt,
      status: total > 0 && summary.completedSets >= total ? "done" : "partial",
      exercises,
    };
  });

  writeLogs(normalizeStore({ ...EMPTY_STORE, sessions }));
  return true;
}
