"use client";

import { Check } from "lucide-react";
import { lsGet, useLocalState, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import type { LoggedSession, LoggedSet } from "@/lib/types";
import type { ParsedSets } from "@/lib/sets";

function makeRows(count: number): LoggedSet[] {
  return Array.from({ length: count }, () => ({ w: 0, r: 0, done: false }));
}

function normalize(rows: LoggedSet[], count: number): LoggedSet[] {
  const out = makeRows(count);
  for (let i = 0; i < count; i++) {
    if (rows[i]) {
      out[i] = { w: rows[i].w ?? 0, r: rows[i].r ?? 0, done: !!rows[i].done };
    }
  }
  return out;
}

function lastSession(exerciseId: string): LoggedSet[] | null {
  const log = lsGet<LoggedSession[]>(keys.log(exerciseId), []);
  const last = log[log.length - 1];
  return last && last.sets.length ? last.sets : null;
}

function seedFromLast(
  exerciseId: string,
  count: number,
  repHigh: number | null,
): LoggedSet[] {
  const last = lastSession(exerciseId);
  if (!last) return makeRows(count);
  const fallbackWeight = last[last.length - 1]?.w ?? 0;
  return Array.from({ length: count }, (_, i) => ({
    w: last[i]?.w ?? fallbackWeight,
    r: last[i]?.r ?? repHigh ?? 0,
    done: false,
  }));
}

export default function SetLogger({
  exerciseId,
  date,
  parsed,
  color,
  onSetChecked,
}: {
  exerciseId: string;
  date: string;
  parsed: ParsedSets;
  color: string;
  onSetChecked: (allDone: boolean) => void;
}) {
  const count = parsed.count;
  const key = keys.setlog(date, exerciseId);
  const { hydrated } = useStorageTick();
  const seed = hydrated
    ? seedFromLast(exerciseId, count, parsed.repHigh)
    : makeRows(count);
  const [saved, setSaved] = useLocalState<LoggedSet[]>(key, seed);
  const rows = normalize(saved, count);
  const last = hydrated ? lastSession(exerciseId) : null;

  const patch = (i: number, p: Partial<LoggedSet>) =>
    setSaved(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  const toggleDone = (i: number) => {
    const nowDone = !rows[i].done;
    const next = rows.map((r, idx) => (idx === i ? { ...r, done: nowDone } : r));
    setSaved(next);
    if (nowDone) onSetChecked(next.every((r) => r.done));
  };

  const prefillNote =
    parsed.repLow != null
      ? parsed.repLow === parsed.repHigh
        ? `${parsed.repLow} reps`
        : `${parsed.repLow}–${parsed.repHigh} reps`
      : "";

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <div className="t-cap flex items-center justify-between">
        <span>Set logger</span>
        {prefillNote && <span>target {prefillNote}</span>}
      </div>
      {rows.map((row, i) => {
        const ghost = last?.[i];
        return (
          <div
            key={i}
            className="rounded-2xl bg-surface2 p-2.5"
            style={row.done ? { boxShadow: `inset 3px 0 0 ${color}`, backgroundColor: `${color}14` } : undefined}
          >
            <div className="grid grid-cols-[24px_1fr_1fr_48px] items-center gap-2.5">
              <span className="num text-center text-sm font-bold text-muted">
                {i + 1}
              </span>
              <Stepper value={row.w} unit="KG" step={2.5} min={0} onChange={(v) => patch(i, { w: v })} />
              <Stepper value={row.r} unit="REPS" step={1} min={0} onChange={(v) => patch(i, { r: v })} />
              <button
                type="button"
                aria-pressed={row.done}
                aria-label={`Set ${i + 1} done`}
                onClick={() => toggleDone(i)}
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform active:scale-95"
                style={{
                  backgroundColor: row.done ? color : "var(--color-surface)",
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
                pichli baar {ghost.w} × {ghost.r}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stepper({
  value,
  unit,
  step,
  min,
  onChange,
}: {
  value: number;
  unit: string;
  step: number;
  min: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.round(v * 2) / 2);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(clamp(value + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(clamp(value - step));
    }
  };
  return (
    <div className="relative flex h-12 items-center overflow-hidden rounded-xl bg-surface">
      <span className="pointer-events-none absolute left-0 right-0 top-1 text-center text-[10px] font-semibold tracking-wider text-muted">
        {unit}
      </span>
      <button
        type="button"
        aria-label={`decrease ${unit}`}
        onClick={() => onChange(clamp(value - step))}
        className="flex h-full w-9 items-center justify-center text-xl text-muted active:bg-surface2"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        step={0.5}
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(clamp(parseFloat(e.target.value) || 0))}
        onKeyDown={onKey}
        aria-label={unit}
        className="num min-w-0 flex-1 bg-transparent pt-3 text-center text-base font-semibold outline-none"
      />
      <button
        type="button"
        aria-label={`increase ${unit}`}
        onClick={() => onChange(clamp(value + step))}
        className="flex h-full w-9 items-center justify-center text-xl text-muted active:bg-surface2"
      >
        +
      </button>
    </div>
  );
}
