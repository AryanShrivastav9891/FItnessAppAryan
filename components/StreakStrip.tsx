"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useStorageTick } from "@/lib/storage";
import { dayColor } from "@/lib/plan";
import { dayIdForKey, weekStripKeys } from "@/lib/date";
import { useTodayKey } from "@/lib/clock";
import { dayState, EMPTY_STORE, readLogs, type DayState } from "@/lib/logs";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function StreakStrip() {
  const { hydrated } = useStorageTick();
  // Mon→Sun shape is the same in every week, so it is safe to prerender; only
  // "which of these is today" needs the device clock.
  const week = weekStripKeys();
  const today = useTodayKey();
  const store = hydrated ? readLogs() : EMPTY_STORE;

  const stateFor = (key: string): DayState => dayState(store, key, today ?? "");

  return (
    <Link href="/week" className="block" aria-label="See the full week">
      <div className="flex items-end justify-between">
        {week.map((key, i) => {
          const state = stateFor(key);
          const isToday = key === today;
          const dId = dayIdForKey(key);
          const color = dId ? dayColor(dId) : "#9aa3b2";
          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <div className="relative flex h-8 w-8 items-center justify-center">
                {isToday && (
                  <span
                    aria-hidden
                    className="animate-soft-pulse absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}` }}
                  />
                )}
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={
                    state === "done"
                      ? { background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "#0a0e14" }
                      : state === "partial"
                        ? { border: `2px solid ${color}`, color }
                        : state === "missed"
                          ? { border: "2px solid #ff6b6b66" }
                          : state === "rest"
                            ? { border: "1.5px dashed #3a4150" }
                            : { border: "2px solid #252a33" }
                  }
                >
                  {state === "done" && <Check size={15} strokeWidth={3} aria-hidden />}
                  {state === "partial" && (
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  )}
                </span>
              </div>
              <span
                className="text-[11px] font-semibold"
                style={{ color: isToday ? color : "#9aa3b2" }}
              >
                {LETTERS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
