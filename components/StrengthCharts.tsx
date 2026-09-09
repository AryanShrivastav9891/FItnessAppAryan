"use client";

import { Card, SectionTitle } from "@/components/ui";
import LineChart from "@/components/LineChart";
import { shortDate } from "@/lib/date";
import { dayColor } from "@/lib/plan";
import { strengthSeries, type LogStore } from "@/lib/logs";

/** The three lifts the plan is judged on — one per pull, push and squat pattern. */
const TRACKED: { id: string; label: string; dayId: string }[] = [
  { id: "monday-barbell-back-squat", label: "Barbell Back Squat", dayId: "monday" },
  { id: "friday-barbell-bench-press", label: "Barbell Bench Press", dayId: "friday" },
  { id: "friday-lat-pulldown", label: "Lat Pulldown", dayId: "friday" },
];

export default function StrengthCharts({ store }: { store: LogStore }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Strength — best set per session</SectionTitle>
      {TRACKED.map(({ id, label, dayId }) => {
        const points = strengthSeries(store, id);
        const color = dayColor(dayId);
        return (
          <Card key={id} className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[15px] font-semibold text-ink">{label}</p>
              {points.length > 0 && (
                <p className="num text-xs text-muted">
                  {points[points.length - 1].kg} kg × {points[points.length - 1].reps}
                </p>
              )}
            </div>

            {points.length >= 2 ? (
              <div className="mt-2">
                <LineChart
                  values={points.map((p) => p.kg)}
                  secondary={{
                    values: points.map((p) => Math.round(p.e1rm * 10) / 10),
                    label: "est. 1RM",
                  }}
                  color={color}
                  unit="kg"
                />
                <p className="num mt-1 flex justify-between text-[11px] text-muted">
                  <span>{shortDate(points[0].date)}</span>
                  <span>{shortDate(points[points.length - 1].date)}</span>
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {points.length === 1
                  ? "One session logged — the line starts from the second."
                  : "No sessions logged yet. Train it once and the line begins."}
              </p>
            )}
          </Card>
        );
      })}
    </section>
  );
}
