"use client";

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
      out[i] = {
        w: rows[i].w ?? 0,
        r: rows[i].r ?? 0,
        done: !!rows[i].done,
      };
    }
  }
  return out;
}

/** Prefill weight/reps from the LAST completed session of this exercise. */
function seedFromLast(
  exerciseId: string,
  count: number,
  repHigh: number | null,
): LoggedSet[] {
  const log = lsGet<LoggedSession[]>(keys.log(exerciseId), []);
  const last = log[log.length - 1];
  if (!last || !last.sets.length) return makeRows(count);
  const fallbackWeight = last.sets[last.sets.length - 1]?.w ?? 0;
  return Array.from({ length: count }, (_, i) => ({
    w: last.sets[i]?.w ?? fallbackWeight,
    r: last.sets[i]?.r ?? repHigh ?? 0,
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
  onSetChecked: () => void;
}) {
  const count = parsed.count;
  const key = keys.setlog(date, exerciseId);
  const { hydrated } = useStorageTick();
  // Seed only after hydration so server HTML and first client paint match.
  const seed = hydrated
    ? seedFromLast(exerciseId, count, parsed.repHigh)
    : makeRows(count);
  const [saved, setSaved] = useLocalState<LoggedSet[]>(key, seed);
  const rows = normalize(saved, count);

  const patch = (i: number, p: Partial<LoggedSet>) =>
    setSaved(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  const toggleDone = (i: number) => {
    const nowDone = !rows[i].done;
    patch(i, { done: nowDone });
    if (nowDone) onSetChecked();
  };

  const prefillNote =
    parsed.repLow != null
      ? parsed.repLow === parsed.repHigh
        ? `${parsed.repLow} reps`
        : `${parsed.repLow}–${parsed.repHigh} reps`
      : "";

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
        <span>Set logger</span>
        {prefillNote && <span>target {prefillNote}</span>}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[28px_1fr_1fr_48px] items-center gap-3 rounded-2xl bg-surface2/50 p-3 shadow-sm backdrop-blur-sm"
          style={row.done ? { 
            background: `linear-gradient(135deg, ${color}15, ${color}08)`,
            border: `2px solid ${color}30`
          } : undefined}
        >
          <span className="text-center text-sm font-bold text-muted tabnum">
            {i + 1}
          </span>
          <Stepper
            value={row.w}
            unit="kg"
            step={2.5}
            min={0}
            onChange={(v) => patch(i, { w: v })}
          />
          <Stepper
            value={row.r}
            unit="reps"
            step={1}
            min={0}
            onChange={(v) => patch(i, { r: v })}
          />
          <button
            type="button"
            aria-pressed={row.done}
            aria-label={`Set ${i + 1} done`}
            onClick={() => toggleDone(i)}
            className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-all active:scale-95"
            style={{
              background: row.done ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'var(--color-surface)',
              border: row.done ? 'none' : '2px solid rgba(255,255,255,0.08)',
              color: row.done ? '#0a0e14' : '#8e95a3',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m5 12 5 5 9-11"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ))}
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
  return (
    <div className="flex items-center overflow-hidden rounded-xl bg-surface shadow-sm">
      <button
        type="button"
        aria-label={`decrease ${unit}`}
        onClick={() => onChange(clamp(value - step))}
        className="flex h-10 w-10 items-center justify-center text-lg text-muted transition-all hover:bg-surface2 active:scale-90"
      >
        −
      </button>
      <label className="flex min-w-0 flex-1 flex-col items-center">
        <input
          type="number"
          inputMode="decimal"
          step={0.5}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(clamp(parseFloat(e.target.value) || 0))}
          className="w-full bg-transparent text-center text-base font-semibold tabnum outline-none"
        />
        <span className="-mt-0.5 text-[10px] text-muted">{unit}</span>
      </label>
      <button
        type="button"
        aria-label={`increase ${unit}`}
        onClick={() => onChange(clamp(value + step))}
        className="flex h-10 w-10 items-center justify-center text-lg text-muted transition-all hover:bg-surface2 active:scale-90"
      >
        +
      </button>
    </div>
  );
}
