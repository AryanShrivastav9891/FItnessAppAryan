// All day-detection is anchored to Asia/Kolkata, per the plan's timezone.

const KOLKATA = "Asia/Kolkata";
const WD_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** YYYY-MM-DD for the given instant in Asia/Kolkata. */
export function todayKey(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KOLKATA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 0=Sunday .. 6=Saturday, in Asia/Kolkata. */
export function weekdayIndex(date: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: KOLKATA,
    weekday: "short",
  }).format(date);
  return WD_SHORT.indexOf(wd);
}

const WEEKDAY_TO_DAYID: Record<number, string | null> = {
  0: null, // Sun — rest
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: null, // Sat — rest
};

/** Today's workout dayId (monday..friday) or null on the weekend. */
export function dayIdForToday(date: Date = new Date()): string | null {
  return WEEKDAY_TO_DAYID[weekdayIndex(date)] ?? null;
}

export function isWeekend(date: Date = new Date()): boolean {
  const wd = weekdayIndex(date);
  return wd === 0 || wd === 6;
}

/** Weekday index (0=Sun..6=Sat) for a YYYY-MM-DD key. */
export function weekdayForKey(key: string): number {
  // Anchor at noon UTC so no timezone shifts the calendar day.
  return new Date(`${key}T12:00:00Z`).getUTCDay();
}

export function dayIdForKey(key: string): string | null {
  return WEEKDAY_TO_DAYID[weekdayForKey(key)] ?? null;
}

export function isWeekendKey(key: string): boolean {
  const wd = weekdayForKey(key);
  return wd === 0 || wd === 6;
}

/**
 * The last `n` calendar-day keys in Asia/Kolkata, oldest first, ending today.
 * Built off a noon-UTC anchor of today's IST date so day subtraction is exact.
 */
export function recentDayKeys(n: number, date: Date = new Date()): string[] {
  const [y, m, d] = todayKey(date).split("-").map(Number);
  const anchor = Date.UTC(y, m - 1, d, 12, 0, 0);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(anchor - i * 86_400_000);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    keys.push(`${yy}-${mm}-${dd}`);
  }
  return keys;
}

/** Yesterday's key in Asia/Kolkata. */
export function yesterdayKey(date: Date = new Date()): string {
  return recentDayKeys(2, date)[0];
}

/** This week's 7 day-keys, Monday → Sunday, in Asia/Kolkata. */
export function weekStripKeys(date: Date = new Date()): string[] {
  const wd = weekdayIndex(date); // 0=Sun..6=Sat
  const sinceMonday = (wd + 6) % 7; // 0 if Monday
  const [y, m, d] = todayKey(date).split("-").map(Number);
  const monAnchor = Date.UTC(y, m - 1, d, 12, 0, 0) - sinceMonday * 86_400_000;
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monAnchor + i * 86_400_000);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    keys.push(`${yy}-${mm}-${dd}`);
  }
  return keys;
}

/** Short weekday label for a key, e.g. "Mon". */
export function shortWeekday(key: string): string {
  return WD_SHORT[weekdayForKey(key)];
}

/** e.g. "24 Jul" for a key. */
export function shortDate(key: string): string {
  const dt = new Date(`${key}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(dt);
}
