"use client";

import Link from "next/link";
import { Check, ChevronRight, Dumbbell, RotateCcw } from "lucide-react";
import type { Day } from "@/lib/types";
import { dayColor, musclesForDay } from "@/lib/plan";
import { useStorageTick } from "@/lib/storage";
import { useTodayKey } from "@/lib/clock";
import {
  EMPTY_STORE,
  planDayState,
  readLogs,
  weekVolumeByDayId,
  type DayState,
} from "@/lib/logs";
import { MuscleGlyphRow } from "./Chips";

const STATE_LABEL: Record<DayState, string> = {
  done: "Done",
  partial: "Partial",
  missed: "Missed",
  planned: "Planned",
  rest: "Rest",
};

function stateStyle(state: DayState, color: string): React.CSSProperties {
  if (state === "done")
    return { background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "#0a0e14" };
  if (state === "partial")
    return { backgroundColor: `${color}22`, color, border: `1px solid ${color}44` };
  if (state === "missed")
    return { backgroundColor: "#ff6b6b1f", color: "#ff6b6b", border: "1px solid #ff6b6b44" };
  return { backgroundColor: "var(--color-surface2)", color: "#9aa3b2" };
}

export default function DayCard({ day }: { day: Day }) {
  const color = dayColor(day.id);
  const { hydrated } = useStorageTick();
  const today = useTodayKey();
  const store = hydrated ? readLogs() : EMPTY_STORE;

  // This week's REAL volume for this day — Σ(kg × reps) over every ticked set,
  // and 0 when the day has not been trained (it used to show the plate colour).
  const volume = today ? Math.round(weekVolumeByDayId(store, today)[day.id] ?? 0) : 0;
  const state = today ? planDayState(store, day.id, today) : "planned";

  return (
    <Link
      href={`/workout/${day.id}`}
      className="block rounded-3xl bg-surface p-4 shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}0a)`,
        backgroundColor: "var(--color-surface)",
        border: `1.5px solid ${color}33`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="t-cap" style={{ color }}>
            {day.day}
          </p>
          <h3 className="t-h2 mt-0.5">{day.title}</h3>
        </div>
        <span className="num flex shrink-0 items-center gap-1 text-xs text-muted">
          {day.exercises.length} ex
          <ChevronRight size={16} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={stateStyle(state, color)}
        >
          {state === "done" && <Check size={12} strokeWidth={3} aria-hidden />}
          {state === "missed" && <RotateCcw size={12} strokeWidth={2.5} aria-hidden />}
          {STATE_LABEL[state]}
        </span>
        <span className="num inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-muted">
          <Dumbbell size={12} strokeWidth={2.5} aria-hidden />
          {hydrated ? volume.toLocaleString("en-IN") : 0} kg this week
        </span>
        {state === "missed" && (
          <span className="text-[11px] font-semibold" style={{ color: "#ffd43b" }}>
            Make it up — tap to start
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted">
        {day.crowdNote}
      </p>

      <div className="mt-3">
        <MuscleGlyphRow primary={musclesForDay(day)} color={color} />
      </div>
    </Link>
  );
}
