"use client";

import { Droplets, Pill } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {/* toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
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
        <p className="text-sm leading-relaxed text-muted">{diet.targets}</p>
      </Card>

      {/* meals */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Din ka khana</SectionTitle>
          <span className="num text-xs text-muted">~{totalProtein} g protein</span>
        </div>
        <Card className="divide-y divide-line">
          {diet.meals.map((meal, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <div className="w-[76px] shrink-0">
                <p className="text-xs font-semibold leading-tight text-ink">
                  {meal.time}
                </p>
              </div>
              <p className="min-w-0 flex-1 text-sm leading-snug text-muted">
                {meal.food}
              </p>
              <span className="num shrink-0 rounded-full bg-surface2 px-2.5 py-1 text-xs font-semibold text-ink">
                {meal.protein}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between p-4">
            <span className="t-cap">Total (bina extra)</span>
            <span className="num text-xl font-bold" style={{ color: "#51cf66" }}>
              ~{totalProtein} g
            </span>
          </div>
        </Card>
        <p className="text-sm leading-relaxed text-muted">{diet.note}</p>
      </section>

      <WaterTracker />

      {/* budget */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Monthly budget (Delhi approx)</SectionTitle>
        <Card className="divide-y divide-line">
          {diet.budget.map((row, i) => {
            const strong = /total/i.test(row.item);
            return (
              <div key={i} className="flex items-start justify-between gap-3 p-3.5">
                <span
                  className={`text-sm leading-snug ${strong ? "font-bold text-ink" : "text-muted"}`}
                >
                  {row.item}
                </span>
                <span
                  className={`num shrink-0 text-sm ${strong ? "font-bold text-ink" : "text-muted"}`}
                >
                  {row.cost}
                </span>
              </div>
            );
          })}
        </Card>
        <p className="rounded-2xl bg-surface2 p-4 text-sm font-medium leading-relaxed text-ink">
          {diet.priority}
        </p>
      </section>

      {/* supplements */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Supplements</SectionTitle>
        <Card className="flex flex-col gap-4 p-4">
          {supplements.map((s) => (
            <div key={s.name} className="flex gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#b197fc1f", color: "#b197fc" }}
              >
                <Pill size={18} strokeWidth={2} />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-ink">{s.name}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.detail}</p>
              </div>
            </div>
          ))}
          <p className="rounded-xl bg-surface2 p-3 text-sm font-medium text-ink">
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle>Paani — aaj (3–4 L)</SectionTitle>
        <span className="num inline-flex items-center gap-1 text-xs text-muted">
          <Droplets size={13} strokeWidth={2} className="text-[#4dabf7]" />
          {water}/{GLASSES} glass
        </span>
      </div>
      <Card className="flex items-center gap-1.5 p-4">
        {Array.from({ length: GLASSES }).map((_, i) => {
          const filled = i < water;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} glass`}
              onClick={() => setWater((w) => (w === i + 1 ? i : i + 1))}
              className="h-11 flex-1 rounded-lg transition-colors"
              style={{
                backgroundColor: filled ? "#4dabf7" : "var(--color-surface2)",
                border: filled ? "none" : "1px solid var(--color-line)",
              }}
            />
          );
        })}
      </Card>
    </section>
  );
}
