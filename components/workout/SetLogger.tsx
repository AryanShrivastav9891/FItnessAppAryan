"use client";

import { Check, Minus, Plus, Sparkles } from "lucide-react";
import { useLocalState, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { shortWeekdayDate } from "@/lib/date";
import type { LastEntry } from "@/lib/logs";
import type { ExerciseConfig, PartConfig } from "@/lib/weights";
import { repRangeLabel } from "@/lib/weights";
import type { Target } from "@/lib/progression";
import { doneSetCount, makeRows, normalizeRows, type DraftSet } from "@/lib/draft";

/** "@ 40 kg" / "@ 12.5 kg per hand" / "@ 30 kg assist" / "@ BW". */
function loadLabel(type: string, kg: number): string {
  if (type === "bodyweight") return "BW";
  if (type === "time") return "";
  if (kg === 0) return "BW";
  if (type === "dumbbell") return `${kg} kg per hand`;
  if (type === "assisted") return `${kg} kg assist`;
  return `${kg} kg`;
}

/** §2 — "3 sets × 6–10 reps @ 40 kg". */
function prescription(
  sets: number,
  c: { type: string; repMin?: number; repMax?: number },
  target: { kg: number; reps: number; seconds?: number },
): string {
  if (target.seconds != null) return `${sets} sets × ${target.seconds} s hold`;
  const range = repRangeLabel(c) || `${target.reps}`;
  const load = loadLabel(c.type, target.kg);
  return `${sets} sets × ${range} reps${load ? ` @ ${load}` : ""}`;
}

function repsLabel(sets: { reps: number }[]): string {
  return sets.map((s) => s.reps).join(", ");
}

export default function SetLogger({
  exerciseId,
  exerciseName,
  date,
  config,
  target,
  last,
  color,
  onSetDone,
}: {
  exerciseId: string;
  exerciseName: string;
  date: string;
  config: ExerciseConfig;
  /** Today's prescription, from the progression engine. */
  target: Target;
  /** The last session that logged this exercise, for the "Last (…)" line. */
  last: LastEntry | null;
  color: string;
  /** Fired when a set is completed — `restNow` is false mid-superset. */
  onSetDone: (opts: { restNow: boolean; allDone: boolean }) => void;
}) {
  const { hydrated } = useStorageTick();
  const firstTime = !last;

  const [saved, setSaved] = useLocalState<DraftSet[] | null>(
    keys.setlog(date, exerciseId),
    null,
  );
  const [note, setNote] = useLocalState<string>(keys.note(date, exerciseId), "");
  const rows = hydrated
    ? normalizeRows(saved, config, target)
    : makeRows(config, target);

  const isSuperset = config.type === "superset" && !!config.parts?.length;
  const isTime = config.type === "time";
  const showKg = !isTime && config.type !== "bodyweight";

  const write = (next: DraftSet[]) => setSaved(next);

  const patch = (i: number, p: Partial<DraftSet>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...p } : r));
    // "Editing set 1's kg auto-fills the rest" — but never over a hand edit.
    if (p.kg != null && rows[i].setIndex === 0) {
      const part = rows[i].part;
      for (let j = 0; j < next.length; j++) {
        if (j === i || next[j].part !== part) continue;
        if (!next[j].kgEdited && !next[j].done) next[j] = { ...next[j], kg: p.kg };
      }
    }
    write(next);
  };

  const toggleDone = (i: number) => {
    const nowDone = !rows[i].done;
    const next = rows.map((r, idx) => (idx === i ? { ...r, done: nowDone } : r));
    write(next);
    if (!nowDone) return;

    // A superset rests only after BOTH halves of that set are ticked.
    const row = next[i];
    const restNow = isSuperset
      ? next.filter((r) => r.setIndex === row.setIndex).every((r) => r.done)
      : true;
    onSetDone({ restNow, allDone: doneSetCount(next, config) >= config.sets });
  };

  const parts = config.parts ?? [];

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* prescription + history + target */}
      <div className="rounded-2xl bg-surface2 p-3.5">
        {isSuperset ? (
          parts.map((p, pi) => (
            <p key={p.name} className="num text-sm font-semibold" style={{ color }}>
              {p.name} — {prescription(config.sets, p, target.parts?.[pi] ?? p)}
            </p>
          ))
        ) : (
          <p className="num text-sm font-semibold" style={{ color }}>
            {prescription(config.sets, config, target)}
          </p>
        )}

        <div className="mt-2 flex flex-col gap-1">
          {last ? (
            <>
              <p className="num text-xs text-muted">
                Last ({shortWeekdayDate(last.date)}):{" "}
                {isSuperset
                  ? parts
                      .map((p, pi) => {
                        const s = last.sets.filter((x) => x.part === pi);
                        return s.length ? `${p.name} ${s[0].kg} × ${repsLabel(s)}` : null;
                      })
                      .filter(Boolean)
                      .join(" · ")
                  : `${last.sets[0]?.kg ?? 0}${isTime ? "" : ""} × ${repsLabel(last.sets)}${isTime ? " s" : ""}`}
              </p>
              <p className="num text-xs">
                <span className="text-ink">
                  Target:{" "}
                  {isTime
                    ? `${target.seconds} s × ${config.sets}`
                    : `${target.kg} × ${Array(config.sets).fill(target.reps).join(", ")}`}
                </span>{" "}
                <span className="text-muted">— {target.reason}</span>
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">First time</span> — start at{" "}
              {isTime ? `${target.seconds} s` : loadLabel(config.type, target.kg)}, adjust ±
              until {isTime ? "the hold" : `${target.reps} reps`} feels hard on the last 2.
            </p>
          )}

          {target.badge && (
            <span
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, #ffd43b30, #ffd43b18)",
                color: "#ffd43b",
                border: "1px solid #ffd43b40",
              }}
            >
              <Sparkles size={12} strokeWidth={2.5} aria-hidden />
              {target.badge}
            </span>
          )}
        </div>

        {config.note && (
          <p className="mt-2 text-xs leading-relaxed text-muted">{config.note}</p>
        )}
      </div>

      {/* rows */}
      <div className="flex flex-col gap-2.5">
        <div className="t-cap flex items-center justify-between">
          <span>Set logger</span>
          <span className="num">
            {hydrated ? doneSetCount(rows, config) : 0}/{config.sets} sets
          </span>
        </div>

        {rows.map((row, i) => {
          const part: PartConfig | undefined = row.part != null ? parts[row.part] : undefined;
          const kgStep = part?.step ?? config.step ?? 2.5;
          const showRowKg = part ? part.type !== "bodyweight" : showKg;
          const ghost = last?.sets.filter((s) =>
            row.part == null ? true : s.part === row.part,
          )[row.setIndex];

          return (
            <div
              key={`${row.part ?? "x"}-${row.setIndex}`}
              className="rounded-2xl bg-surface2 p-2.5 shadow-sm"
              style={
                row.done
                  ? {
                      background: `linear-gradient(135deg, ${color}15, ${color}08)`,
                      border: `2px solid ${color}30`,
                    }
                  : undefined
              }
            >
              {part && (
                <p className="mb-1.5 pl-[34px] text-[11px] font-semibold text-muted">
                  {part.name}
                </p>
              )}
              <div className="grid grid-cols-[24px_1fr_1fr_48px] items-center gap-2.5">
                <span className="num text-center text-sm font-bold text-muted">
                  {row.setIndex + 1}
                </span>

                {showRowKg ? (
                  <Stepper
                    value={row.kg}
                    unit="KG"
                    step={kgStep > 0 ? kgStep : 2.5}
                    highlight={firstTime}
                    zeroLabel="BW"
                    onChange={(v) => patch(i, { kg: v, kgEdited: true })}
                  />
                ) : (
                  <span className="flex h-12 items-center justify-center rounded-xl bg-surface text-sm font-bold text-muted">
                    BW
                  </span>
                )}

                <Stepper
                  value={row.reps}
                  unit={isTime ? "SEC" : "REPS"}
                  step={isTime ? (config.step || 5) : 1}
                  highlight={firstTime}
                  onChange={(v) => patch(i, { reps: v, repsEdited: true })}
                />

                <button
                  type="button"
                  aria-pressed={row.done}
                  aria-label={`${part ? `${part.name} ` : ""}set ${row.setIndex + 1} done`}
                  onClick={() => toggleDone(i)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform active:scale-95"
                  style={{
                    background: row.done
                      ? `linear-gradient(135deg, ${color}, ${color}dd)`
                      : "var(--color-surface)",
                    border: row.done ? "none" : "2px solid var(--color-line)",
                    color: row.done ? "#0a0e14" : "#9aa3b2",
                  }}
                >
                  {row.done ? (
                    <span className="animate-check-pop">
                      <Check size={22} strokeWidth={3} aria-hidden />
                    </span>
                  ) : (
                    <Check size={22} strokeWidth={2.4} aria-hidden />
                  )}
                </button>
              </div>

              {ghost && !row.done && (
                <p className="num mt-1.5 pl-[34px] text-xs text-muted">
                  last time {ghost.kg} × {ghost.reps}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* per-exercise note */}
      <label className="flex flex-col gap-1">
        <span className="t-cap">Note (optional)</span>
        <input
          type="text"
          value={hydrated ? note : ""}
          onChange={(e) => setNote(e.target.value)}
          placeholder="form doubt, felt in arms, machine busy…"
          aria-label={`Note for ${exerciseName}`}
          className="min-h-[44px] rounded-xl bg-surface2 px-3 text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </label>
    </div>
  );
}

function Stepper({
  value,
  unit,
  step,
  highlight,
  zeroLabel,
  onChange,
}: {
  value: number;
  unit: string;
  step: number;
  highlight?: boolean;
  /** Shown instead of a bare 0 — an unloaded lift reads "BW", never "0 kg". */
  zeroLabel?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(0, Math.round(v * 100) / 100);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(clamp(value + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(clamp(value - step));
    }
  };
  // "Find your weight": with no history the ± buttons are the point, so they
  // get the accent treatment instead of sitting quiet at the edges.
  const btn = `flex h-full w-11 items-center justify-center active:bg-surface3 ${
    highlight ? "text-ink" : "text-muted"
  }`;
  return (
    <div
      className="relative flex h-12 items-center overflow-hidden rounded-xl bg-surface"
      style={highlight ? { border: "1px solid var(--color-line)" } : undefined}
    >
      <span className="pointer-events-none absolute left-0 right-0 top-1 text-center text-[10px] font-semibold tracking-wider text-muted">
        {unit}
      </span>
      <button
        type="button"
        aria-label={`decrease ${unit}`}
        onClick={() => onChange(clamp(value - step))}
        className={btn}
      >
        <Minus size={16} strokeWidth={3} aria-hidden />
      </button>
      {zeroLabel && value === 0 ? (
        <button
          type="button"
          onClick={() => onChange(step)}
          aria-label={`${unit}: ${zeroLabel}, tap to add weight`}
          className="num min-w-0 flex-1 bg-transparent pt-3 text-center text-base font-semibold text-muted outline-none"
        >
          {zeroLabel}
        </button>
      ) : (
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(clamp(parseFloat(e.target.value) || 0))}
          onKeyDown={onKey}
          aria-label={unit}
          className="num min-w-0 flex-1 bg-transparent pt-3 text-center text-base font-semibold outline-none"
        />
      )}
      <button
        type="button"
        aria-label={`increase ${unit}`}
        onClick={() => onChange(clamp(value + step))}
        className={btn}
      >
        <Plus size={16} strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}
