"use client";

import Link from "next/link";
import { CalendarX, RotateCcw } from "lucide-react";
import { useStorageTick } from "@/lib/storage";
import { useTodayKey } from "@/lib/clock";
import { dayIdForKey, shortWeekdayDate } from "@/lib/date";
import { getDay, dayColor } from "@/lib/plan";
import { EMPTY_STORE, missedThisWeek, monthStats, readLogs, weekStats } from "@/lib/logs";
import { Card } from "@/components/ui";

/**
 * §5 — missed counts for the week and the month, plus the make-up shortcut: a
 * missed day's workout can be started on any later day and still logs under its
 * own dayId.
 */
export default function MissedSummary({ compact = false }: { compact?: boolean }) {
  const { hydrated } = useStorageTick();
  const today = useTodayKey();
  if (!hydrated || !today) return null;

  const store = readLogs() ?? EMPTY_STORE;
  const week = weekStats(store, today);
  const month = monthStats(store, today);
  const missed = missedThisWeek(store, today);

  if (week.missed === 0 && month.missed === 0) {
    if (compact) return null;
    return (
      <Card className="p-4" accent="#51cf66">
        <p className="t-cap" style={{ color: "#51cf66" }}>
          Nothing missed
        </p>
        <p className="mt-1 text-sm text-muted">
          <span className="num font-semibold text-ink">
            {week.done + week.partial}/{week.planned}
          </span>{" "}
          days trained this week. Keep it boring — boring is what works.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4" accent="#ffd43b">
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#ffd43b26", color: "#ffd43b" }}
        >
          <CalendarX size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-cap" style={{ color: "#ffd43b" }}>
            Missed days
          </p>
          <p className="num mt-1 text-sm font-semibold">
            {week.missed} this week · {month.missed} this month
          </p>

          {missed.length > 0 && (
            <>
              <p className="mt-2 text-xs text-muted">
                A missed day can still be trained later — it logs under its own day.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missed.map((key) => {
                  const dayId = dayIdForKey(key);
                  const day = dayId ? getDay(dayId) : undefined;
                  if (!day) return null;
                  return (
                    <Link
                      key={key}
                      href={`/workout/${day.id}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-bold"
                      style={{
                        backgroundColor: `${dayColor(day.id)}1f`,
                        color: dayColor(day.id),
                        border: `1px solid ${dayColor(day.id)}44`,
                      }}
                    >
                      <RotateCcw size={12} strokeWidth={2.5} aria-hidden />
                      Make up {shortWeekdayDate(key)}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
