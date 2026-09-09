"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Timer, ArrowRight, Check } from "lucide-react";
import { lsGet, lsSet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { todayKey } from "@/lib/date";
import { parseSets } from "@/lib/sets";
import { week as WEEK } from "@/lib/plan";
import { fallbackConfig, getConfig, type ExerciseConfig } from "@/lib/weights";
import { countDoneRaw, type DraftSet } from "@/lib/draft";
import {
  clearOverrides,
  updateLogs,
  type LogExercise,
  type LogSession,
  type LogSet,
} from "@/lib/logs";
import type { Day } from "@/lib/types";
import BarbellLoader from "@/components/BarbellLoader";
import WarmupList from "./WarmupList";
import StretchList from "./StretchList";
import ExerciseCard from "./ExerciseCard";
import RestTimer from "./RestTimer";
import SessionComplete from "./SessionComplete";

type Phase = "warmup" | "lift" | "stretch";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function configFor(ex: { id: string; sets: string }): ExerciseConfig {
  const parsed = parseSets(ex.sets);
  return getConfig(ex.id) ?? fallbackConfig(parsed.count, parsed.repLow, parsed.repHigh);
}

/** Strip the UI-only edit flags before a row goes into the log. */
function toLogSet(r: DraftSet): LogSet {
  const out: LogSet = { kg: r.kg, reps: r.reps, done: r.done === true };
  if (r.part === 0 || r.part === 1) out.part = r.part;
  return out;
}

export default function WorkoutSession({
  day,
  color,
  overloadRule,
}: {
  day: Day;
  color: string;
  overloadRule: string;
}) {
  const [date] = useState(() => todayKey());
  const [phase, setPhase] = useState<Phase>("warmup");
  const [activeIdx, setActiveIdx] = useState(0);
  const [rest, setRest] = useState<{ seconds: number; id: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState({ completedSets: 0, volumeKg: 0, durationMin: 0 });
  const [nowTs, setNowTs] = useState(() => Date.now());
  const restId = useRef(0);
  const { hydrated } = useStorageTick();

  useEffect(() => {
    const sk = keys.start(date, day.id);
    if (lsGet<number | null>(sk, null) == null) lsSet(sk, Date.now());
  }, [date, day.id]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Set counts come from the starting-weight config (Monday = 19, Friday = 21 —
  // a superset set counts once, not once per half).
  const totalSets = day.exercises.reduce((n, e) => n + configFor(e).sets, 0);

  let doneSets = 0;
  if (hydrated) {
    for (const ex of day.exercises) {
      doneSets += countDoneRaw(lsGet<unknown>(keys.setlog(date, ex.id), null), configFor(ex));
    }
  }
  const wuDone = hydrated ? lsGet<string[]>(keys.warmup(date), []).length : 0;
  const stDone = hydrated ? lsGet<string[]>(keys.stretch(date), []).length : 0;

  const startedAt = hydrated ? lsGet<number | null>(keys.start(date, day.id), null) : null;
  const elapsedSec = startedAt ? Math.max(0, Math.floor((nowTs - startedAt) / 1000)) : 0;
  const elapsed = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}`;

  const startRest = (seconds: number) => {
    restId.current += 1;
    setRest({ seconds, id: restId.current });
  };

  const completeExercise = (idx: number) => {
    if (idx < day.exercises.length - 1) {
      window.setTimeout(() => setActiveIdx(idx + 1), 350);
    }
  };

  const nextDay = WEEK[(WEEK.findIndex((d) => d.id === day.id) + 1) % WEEK.length];
  const nextLabel = `${cap(nextDay.title.split(/[ (]/)[0])} — ${nextDay.day}`;

  /**
   * Write the session into coach:logs.v1. Every row goes in — ticked or not —
   * so the progression engine can tell a completed session from a partial one.
   * The day is logged under `day.id` with the ACTUAL date, which is what makes
   * a make-up (Monday's workout trained on Saturday) land in the right place.
   */
  const finish = () => {
    let completedSets = 0;
    let volumeKg = 0;
    const exercises: LogExercise[] = [];
    const loggedIds: string[] = [];

    for (const ex of day.exercises) {
      const config = configFor(ex);
      const rows = lsGet<DraftSet[]>(keys.setlog(date, ex.id), []);
      const done = countDoneRaw(rows, config);
      if (!Array.isArray(rows) || !rows.length || done === 0) continue;

      completedSets += done;
      volumeKg += rows.reduce((s, r) => s + (r.done ? (r.kg ?? 0) * (r.reps ?? 0) : 0), 0);

      const note = lsGet<string>(keys.note(date, ex.id), "").trim();
      exercises.push({
        exerciseId: ex.id,
        sets: rows.map(toLogSet),
        ...(note ? { note } : {}),
      });
      loggedIds.push(ex.id);
    }

    const startedAt = lsGet<number | null>(keys.start(date, day.id), null) ?? Date.now();
    const finishedAt = Date.now();
    const durationMin = Math.max(1, Math.round((finishedAt - startedAt) / 60000));

    const session: LogSession = {
      id: `${date}-${day.id}`,
      date,
      dayId: day.id,
      startedAt,
      finishedAt,
      status: completedSets >= totalSets ? "done" : "partial",
      exercises,
    };

    updateLogs((store) => ({
      ...store,
      sessions: [...store.sessions.filter((s) => s.id !== session.id), session].sort(
        (a, b) => a.date.localeCompare(b.date),
      ),
    }));
    // §4.5 — a hand-set weight applies to one session, then it is spent.
    clearOverrides(loggedIds);

    setSummary({ completedSets, volumeKg, durationMin });
    setFinished(true);
    window.scrollTo({ top: 0 });
  };

  const tabs: { id: Phase; label: string; badge: string }[] = [
    { id: "warmup", label: "Warm-up", badge: `${wuDone}/${day.warmup.length}` },
    { id: "lift", label: "Lift", badge: `${doneSets}/${totalSets}` },
    { id: "stretch", label: "Stretch", badge: `${stDone}/${day.static.length}` },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* sticky mini-header */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-iron/90 px-4 pb-2.5 pt-2 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex h-10 items-center gap-0.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft size={18} strokeWidth={2} /> Today
          </Link>
          <div className="text-center">
            <p className="t-cap" style={{ color }}>
              {day.day}
            </p>
            <p className="t-h3">{day.title}</p>
          </div>
          <div className="flex w-16 flex-col items-end gap-0.5">
            <BarbellLoader total={totalSets} done={hydrated ? doneSets : 0} color={color} animate={hydrated} />
            <span className="num inline-flex items-center gap-1 text-[11px] text-muted">
              <Timer size={11} strokeWidth={2} />
              {hydrated ? elapsed : "0:00"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex gap-2">
          {tabs.map((t) => {
            const active = phase === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPhase(t.id)}
                className="flex min-h-[46px] flex-1 flex-col items-center justify-center rounded-2xl text-sm font-semibold shadow-sm transition-all active:scale-95"
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${color}30, ${color}20)`
                    : "var(--color-surface2)",
                  color: active ? "#e8eaed" : "#9aa3b2",
                  border: active ? `1px solid ${color}40` : "1px solid transparent",
                }}
              >
                <span>{t.label}</span>
                <span className="num text-xs text-muted">{t.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* WARM-UP */}
      {phase === "warmup" && (
        <div className="flex flex-col gap-5">
          <WarmupList items={day.warmup} date={date} color={color} />
          <PrimaryButton color={color} onClick={() => { setPhase("lift"); window.scrollTo({ top: 0 }); }}>
            Warm-up done — go to Lift <ArrowRight size={18} strokeWidth={2.5} />
          </PrimaryButton>
        </div>
      )}

      {/* LIFT — one exercise expanded at a time */}
      {phase === "lift" && (
        <div className="flex flex-col gap-3">
          {day.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              date={date}
              color={color}
              overloadRule={overloadRule}
              active={activeIdx === i}
              onExpand={() => setActiveIdx(i)}
              onStartRest={startRest}
              onComplete={() => completeExercise(i)}
            />
          ))}
          <button
            type="button"
            onClick={() => { setPhase("stretch"); window.scrollTo({ top: 0 }); }}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 text-sm font-bold transition-transform active:scale-[0.98]"
            style={{ borderColor: color, color }}
          >
            Lifts done — go to Stretch <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* STRETCH */}
      {phase === "stretch" && (
        <div className="flex flex-col gap-5">
          <StretchList items={day.static} date={date} color={color} />
          <PrimaryButton color={color} onClick={finish}>
            <Check size={20} strokeWidth={2.5} /> Session Complete
          </PrimaryButton>
        </div>
      )}

      {rest && (
        <RestTimer key={rest.id} seconds={rest.seconds} color={color} onClose={() => setRest(null)} />
      )}

      {finished && (
        <SessionComplete
          dayTitle={day.title}
          totalSets={totalSets}
          completedSets={summary.completedSets}
          volumeKg={summary.volumeKg}
          durationMin={summary.durationMin}
          color={color}
          nextLabel={nextLabel}
          onClose={() => setFinished(false)}
        />
      )}
    </div>
  );
}

function PrimaryButton({
  color,
  onClick,
  children,
}: {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-md transition-transform active:scale-[0.98]"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#0a0e14" }}
    >
      {children}
    </button>
  );
}
