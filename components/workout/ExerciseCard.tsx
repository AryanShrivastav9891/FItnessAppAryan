"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Play, TrendingUp, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { lsGet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { parseSets, qualifiesForOverload } from "@/lib/sets";
import type { Exercise, LoggedSession, LoggedSet } from "@/lib/types";
import { MuscleChips } from "@/components/Chips";
import { Disclosure } from "@/components/Disclosure";
import { ExternalLink } from "@/components/ui";
import Sheet from "@/components/Sheet";
import SetLogger from "./SetLogger";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ExerciseCard({
  exercise,
  date,
  color,
  overloadRule,
  active,
  onExpand,
  onStartRest,
  onComplete,
}: {
  exercise: Exercise;
  date: string;
  color: string;
  overloadRule: string;
  active: boolean;
  onExpand: () => void;
  onStartRest: (seconds: number) => void;
  onComplete: () => void;
}) {
  const parsed = parseSets(exercise.sets);
  const total = parsed.count;
  const [showRule, setShowRule] = useState(false);
  const { hydrated } = useStorageTick();
  const ref = useRef<HTMLElement | null>(null);
  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
  };

  const rows = hydrated ? lsGet<LoggedSet[]>(keys.setlog(date, exercise.id), []) : [];
  const doneCount = rows.filter((r) => r.done).length;

  let overload = false;
  if (hydrated) {
    const log = lsGet<LoggedSession[]>(keys.log(exercise.id), []);
    overload = qualifiesForOverload(log[log.length - 1]?.sets, parsed.repHigh);
  }

  // When this card becomes the active one, bring it into view.
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center",
      });
    }
  }, [active]);

  if (!active) {
    const complete = doneCount >= total && total > 0;
    return (
      <button
        ref={setRef}
        type="button"
        onClick={onExpand}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-left shadow-sm transition-all active:scale-[0.99]"
      >
        <span
          className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={
            complete
              ? { background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "#0a0e14" }
              : { border: `2px solid ${color}`, color }
          }
        >
          {complete ? <Check size={16} strokeWidth={3} aria-hidden /> : exercise.order}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">
            {exercise.name}
          </span>
          <span className="num block text-xs text-muted">{exercise.sets}</span>
        </span>
        <MiniRing done={doneCount} total={total} color={color} />
      </button>
    );
  }

  return (
    <article
      ref={setRef}
      className="scroll-mt-40 rounded-3xl border border-line bg-surface p-5 shadow-md"
    >
      <div className="flex items-start gap-3">
        <span
          className="num mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "#0a0e14" }}
        >
          {exercise.order}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="t-h3">{exercise.name}</h3>
          <p className="num text-sm font-semibold" style={{ color }}>
            {exercise.sets}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <MuscleChips primary={exercise.primary} secondary={exercise.secondary} color={color} />
      </div>

      {overload && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRule(true)}
            className="animate-chip-pulse inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
            style={{
              background: "linear-gradient(135deg, #51cf6630, #51cf6620)",
              color: "#51cf66",
              border: "1px solid #51cf6640",
            }}
          >
            <TrendingUp size={14} strokeWidth={2.5} aria-hidden />
            +2.5 kg
          </button>
          <Sheet open={showRule} onClose={() => setShowRule(false)} labelledBy="ov-title">
            <h2 id="ov-title" className="t-h2" style={{ color: "#51cf66" }}>
              Progressive overload
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{overloadRule}</p>
            <button
              type="button"
              onClick={() => setShowRule(false)}
              className="mt-5 min-h-[48px] w-full rounded-2xl bg-surface2 text-sm font-semibold text-ink active:scale-[0.99]"
            >
              Samajh gaya
            </button>
          </Sheet>
        </div>
      )}

      <div className="mt-4 flex flex-col divide-y divide-line">
        <Disclosure summary="Form / best position" defaultOpen accent="#51cf66" tone="form">
          {exercise.form}
        </Disclosure>
        <Disclosure summary="Galti mat karna" accent="#ff6b6b" tone="danger">
          {exercise.mistakes}
        </Disclosure>
      </div>

      {exercise.backup && (
        <p className="mt-3 text-sm text-muted">
          <span className="font-semibold text-ink">Busy ho toh: </span>
          {exercise.backup}
        </p>
      )}

      <SetLogger
        exerciseId={exercise.id}
        date={date}
        parsed={parsed}
        color={color}
        onSetChecked={(allDone) => {
          onStartRest(exercise.restSeconds);
          if (allDone) onComplete();
        }}
      />

      <div className="mt-4 flex gap-3">
        <ExternalLink
          href={exercise.video}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-surface2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          <Play size={16} strokeWidth={2.5} fill="currentColor" /> Video
        </ExternalLink>
        <ExternalLink
          href="https://musclewiki.com"
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-surface2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          <ExternalLinkIcon size={16} strokeWidth={2} /> MuscleWiki
        </ExternalLink>
      </div>
    </article>
  );
}

function MiniRing({ done, total, color }: { done: number; total: number; color: string }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const complete = done >= total && total > 0;
  return (
    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-7 w-7 -rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="#252a33" strokeWidth="2.5" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      {complete ? (
        <Check size={12} strokeWidth={3} className="absolute" style={{ color }} aria-hidden />
      ) : (
        <span className="num absolute text-[10px] font-bold text-muted">{done}</span>
      )}
    </span>
  );
}
