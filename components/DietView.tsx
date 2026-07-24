"use client";

import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { todayKey } from "@/lib/date";
import type { Diet, DietMode, Supplement } from "@/lib/types";
import { Card, SectionTitle } from "@/components/ui";

function proteinNum(s: string): number {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export default function DietView({
  diets,
  supplements,
  supplementsPriority,
}: {
  diets: Record<DietMode, Diet>;
  supplements: Supplement[];
  supplementsPriority: string;
}) {
  const [mode, setMode] = useLocalState<DietMode>(keys.dietMode, "regular");
  const diet = diets[mode] ?? diets.regular;
  const totalProtein = diet.meals.reduce((n, m) => n + proteinNum(m.protein), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
        {(Object.keys(diets) as DietMode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={active}
              className={`min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                active ? "bg-ink text-iron" : "text-muted"
              }`}
            >
              {diets[m].label}
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <p className="text-[13px] leading-relaxed text-muted">{diet.targets}</p>
      </Card>

      {/* meal timeline */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SectionTitle>Din ka khana</SectionTitle>
          <span className="text-[11px] text-muted tabnum">
            ~{totalProtein} g protein
          </span>
        </div>
        <Card className="divide-y divide-line">
          {diet.meals.map((meal, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="w-[74px] shrink-0">
                <p className="text-[11px] font-semibold leading-tight text-ink">
                  {meal.time}
                </p>
              </div>
              <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted">
                {meal.food}
              </p>
              <span className="shrink-0 rounded-full bg-surface2 px-2 py-1 text-[11px] font-semibold tabnum text-ink">
                {meal.protein}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between p-3">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              Total (bina extra)
            </span>
            <span className="font-display text-xl tabnum text-success">
              ~{totalProtein} g
            </span>
          </div>
        </Card>
        <p className="text-[12px] leading-relaxed text-muted">{diet.note}</p>
      </section>

      <WaterTracker />

      {/* budget */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Monthly budget (Delhi approx)</SectionTitle>
        <Card className="divide-y divide-line">
          {diet.budget.map((row, i) => {
            const strong = /total/i.test(row.item);
            return (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-3"
              >
                <span
                  className={`text-[13px] leading-snug ${strong ? "font-bold text-ink" : "text-muted"}`}
                >
                  {row.item}
                </span>
                <span
                  className={`shrink-0 text-[13px] tabnum ${strong ? "font-bold text-ink" : "text-muted"}`}
                >
                  {row.cost}
                </span>
              </div>
            );
          })}
        </Card>
        <p className="rounded-xl bg-surface2 p-3 text-[12px] font-medium leading-relaxed text-ink">
          {diet.priority}
        </p>
      </section>

      {/* supplements */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Supplements</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          {supplements.map((s) => (
            <div key={s.name}>
              <p className="text-sm font-semibold text-ink">{s.name}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                {s.detail}
              </p>
            </div>
          ))}
          <p className="rounded-lg bg-surface2 p-2.5 text-[12px] font-medium text-ink">
            {supplementsPriority}
          </p>
        </Card>
      </section>
    </div>
  );
}

function WaterTracker() {
  const date = todayKey();
  const [water, setWater] = useLocalState<number>(keys.water(date), 0);
  const GLASSES = 8;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <SectionTitle>Paani — aaj (3–4 L)</SectionTitle>
        <span className="text-[11px] text-muted tabnum">{water}/{GLASSES} glass</span>
      </div>
      <Card className="flex items-center justify-between gap-1.5 p-3">
        {Array.from({ length: GLASSES }).map((_, i) => {
          const filled = i < water;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} glass`}
              onClick={() => setWater((w) => (w === i + 1 ? i : i + 1))}
              className="flex h-11 flex-1 items-end justify-center"
            >
              <span
                className="flex w-6 flex-col justify-end overflow-hidden rounded-b-md rounded-t-sm border transition-colors"
                style={{
                  height: 34,
                  borderColor: filled ? "#3B6FD6" : "#2b3742",
                  backgroundColor: filled ? "#3B6FD6" : "transparent",
                }}
              />
            </button>
          );
        })}
      </Card>
    </section>
  );
}
