"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { dayColor } from "@/lib/plan";
import { dayIdForKey, isWeekendKey, todayKey, weekStripKeys } from "@/lib/date";
import type { SessionsMap } from "@/lib/types";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

type State = "done" | "missed" | "planned" | "rest";

export default function StreakStrip() {
  const [sessions] = useLocalState<SessionsMap>(keys.sessions, {});
  const week = weekStripKeys();
  const today = todayKey();

  const stateFor = (key: string): State => {
    if (sessions[key]) return "done";
    if (isWeekendKey(key)) return "rest";
    if (key < today) return "missed";
    return "planned";
  };

  return (
    <Link href="/week" className="block" aria-label="Poora hafta dekho">
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
                      ? { backgroundColor: color, color: "#0a0e14" }
                      : state === "missed"
                        ? { border: "2px solid #ff6b6b66" }
                        : state === "rest"
                          ? { border: "1.5px dashed #3a4150" }
                          : { border: "2px solid #252a33" }
                  }
                >
                  {state === "done" && <Check size={15} strokeWidth={3} aria-hidden />}
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
