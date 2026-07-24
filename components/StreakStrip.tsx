"use client";

import { useLocalState } from "@/lib/storage";
import { dayColor } from "@/lib/plan";
import {
  dayIdForKey,
  isWeekendKey,
  recentDayKeys,
  shortWeekday,
  todayKey,
} from "@/lib/date";
import type { SessionsMap } from "@/lib/types";

type DotState = "done" | "missed" | "rest" | "today";

export default function StreakStrip() {
  const [sessions] = useLocalState<SessionsMap>("sessions", {});
  const keys = recentDayKeys(14);
  const today = todayKey();

  const stateFor = (key: string): { state: DotState; color: string } => {
    const done = Boolean(sessions[key]);
    if (done) {
      const id = dayIdForKey(key);
      return { state: "done", color: id ? dayColor(id) : "#4ade80" };
    }
    if (isWeekendKey(key)) return { state: "rest", color: "#3a4652" };
    if (key === today) return { state: "today", color: "#8b96a3" };
    return { state: "missed", color: "#d64545" };
  };

  return (
    <div className="flex items-end justify-between gap-1">
      {keys.map((key) => {
        const { state, color } = stateFor(key);
        const label = shortWeekday(key)[0];
        return (
          <div key={key} className="flex flex-1 flex-col items-center gap-1">
            <span
              title={`${key} — ${state}`}
              className="h-6 w-full rounded-md"
              style={{
                backgroundColor:
                  state === "done"
                    ? color
                    : state === "rest"
                      ? "#1a2027"
                      : "transparent",
                border:
                  state === "done"
                    ? "none"
                    : state === "missed"
                      ? "1.5px solid #d6454577"
                      : state === "today"
                        ? "1.5px dashed #8b96a3"
                        : "1.5px solid #2b3742",
              }}
            />
            <span className="text-[9px] text-muted">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
