import Link from "next/link";
import type { Day } from "@/lib/types";
import { dayColor, musclesForDay, DAY_PLATE_KG } from "@/lib/plan";
import { Chip } from "./Chips";

export default function DayCard({ day }: { day: Day }) {
  const color = dayColor(day.id);
  const muscles = musclesForDay(day);

  return (
    <Link
      href={`/workout/${day.id}`}
      className="group block rounded-3xl bg-surface p-5 shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
      style={{ 
        background: `linear-gradient(135deg, ${color}10 0%, transparent 50%)`,
        backgroundColor: 'var(--color-surface)'
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {day.day}
          </p>
          <h3 className="font-display text-3xl leading-tight">{day.title}</h3>
        </div>
        <span className="shrink-0 text-xs text-muted tabnum">
          {day.exercises.length} ex · {DAY_PLATE_KG[day.id]}kg
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {day.crowdNote}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {muscles.map((m) => (
          <Chip key={m} label={m} color={color} filled />
        ))}
      </div>
    </Link>
  );
}
