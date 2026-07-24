import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Day } from "@/lib/types";
import { dayColor, musclesForDay, DAY_PLATE_KG } from "@/lib/plan";
import { MuscleGlyphRow } from "./Chips";

export default function DayCard({ day }: { day: Day }) {
  const color = dayColor(day.id);

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
          {day.exercises.length} ex · {DAY_PLATE_KG[day.id]}kg
          <ChevronRight size={16} strokeWidth={2} />
        </span>
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
