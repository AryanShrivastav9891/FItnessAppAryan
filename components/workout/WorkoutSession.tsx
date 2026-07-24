"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { lsGet, lsSet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { todayKey } from "@/lib/date";
import { parseSets } from "@/lib/sets";
import type {
  Day,
  LoggedSession,
  LoggedSet,
  SessionsMap,
} from "@/lib/types";
import BarbellLoader from "@/components/BarbellLoader";
import WarmupList from "./WarmupList";
import StretchList from "./StretchList";
import ExerciseCard from "./ExerciseCard";
import RestTimer from "./RestTimer";
import SessionComplete from "./SessionComplete";

type Phase = "warmup" | "lift" | "stretch";

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
  const [rest, setRest] = useState<{ seconds: number; id: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState({
    completedSets: 0,
    volumeKg: 0,
    durationMin: 0,
  });
  const restId = useRef(0);
  const { hydrated } = useStorageTick();

  // Stamp a session start time once (used for duration on finish).
  useEffect(() => {
    const sk = keys.start(date, day.id);
    if (lsGet<number | null>(sk, null) == null) lsSet(sk, Date.now());
  }, [date, day.id]);

  const totalSets = day.exercises.reduce(
    (n, e) => n + parseSets(e.sets).count,
    0,
  );

  // live counts (only trusted after hydration)
  let doneSets = 0;
  if (hydrated) {
    for (const ex of day.exercises) {
      doneSets += lsGet<LoggedSet[]>(keys.setlog(date, ex.id), []).filter(
        (r) => r.done,
      ).length;
    }
  }
  const wuDone = hydrated
    ? lsGet<string[]>(keys.warmup(date), []).length
    : 0;
  const stDone = hydrated ? lsGet<string[]>(keys.stretch(date), []).length : 0;

  const startRest = (seconds: number) => {
    restId.current += 1;
    setRest({ seconds, id: restId.current });
  };

  const finish = () => {
    let completedSets = 0;
    let volumeKg = 0;
    for (const ex of day.exercises) {
      const rows = lsGet<LoggedSet[]>(keys.setlog(date, ex.id), []);
      const doneRows = rows.filter((r) => r.done);
      if (!doneRows.length) continue;
      completedSets += doneRows.length;
      volumeKg += doneRows.reduce((s, r) => s + (r.w ?? 0) * (r.r ?? 0), 0);
      const log = lsGet<LoggedSession[]>(keys.log(ex.id), []);
      if (!log.some((s) => s.date === date)) {
        log.push({ date, sets: doneRows.map((r) => ({ w: r.w, r: r.r })) });
        lsSet(keys.log(ex.id), log);
      }
    }
    const startedAt = lsGet<number | null>(keys.start(date, day.id), null);
    const durationMin = startedAt
      ? Math.max(1, Math.round((Date.now() - startedAt) / 60000))
      : 0;

    const sessions = lsGet<SessionsMap>(keys.sessions, {});
    sessions[date] = { dayId: day.id, completedSets, durationMin, volumeKg };
    lsSet(keys.sessions, sessions);

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
    <div className="flex flex-col gap-5">
      {/* sticky header + phase tabs */}
      <div className="sticky top-0 z-20 -mx-4 bg-iron/95 px-4 pb-3 pt-3 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex h-10 items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            ‹ Aaj
          </Link>
          <div className="text-center">
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color }}
            >
              {day.day}
            </p>
            <p className="font-display text-xl leading-tight">{day.title}</p>
          </div>
          <div className="w-16 shrink-0">
            <BarbellLoader
              total={totalSets}
              done={hydrated ? doneSets : 0}
              color={color}
              animate={hydrated}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {tabs.map((t) => {
            const active = phase === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPhase(t.id)}
                className="flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-2xl text-sm font-semibold shadow-sm transition-all active:scale-95"
                style={{
                  background: active ? `linear-gradient(135deg, ${color}30, ${color}20)` : "var(--color-surface2)",
                  color: active ? "#e8eaed" : "#8e95a3",
                  border: active ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <span>{t.label}</span>
                <span className="text-xs font-medium tabnum text-muted">
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* phase content */}
      {phase === "warmup" && (
        <div className="flex flex-col gap-5">
          <WarmupList items={day.warmup} date={date} color={color} />
          <button
            type="button"
            onClick={() => {
              setPhase("lift");
              window.scrollTo({ top: 0 });
            }}
            className="flex min-h-[52px] items-center justify-center rounded-2xl text-sm font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
            style={{ 
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              color: '#0a0e14'
            }}
          >
            Warm-up done — Lift pe jao →
          </button>
        </div>
      )}

      {phase === "lift" && (
        <div className="flex flex-col gap-4">
          {day.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              date={date}
              color={color}
              overloadRule={overloadRule}
              onStartRest={startRest}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              setPhase("stretch");
              window.scrollTo({ top: 0 });
            }}
            className="flex min-h-[52px] items-center justify-center rounded-2xl text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
            style={{ 
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              color,
              border: `2px solid ${color}40`
            }}
          >
            Lifts done — Stretch pe jao →
          </button>
        </div>
      )}

      {phase === "stretch" && (
        <div className="flex flex-col gap-5">
          <StretchList items={day.static} date={date} color={color} />
          <button
            type="button"
            onClick={finish}
            className="flex min-h-[56px] items-center justify-center rounded-2xl text-base font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
            style={{ 
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              color: '#0a0e14'
            }}
          >
            ✓ Session Complete
          </button>
        </div>
      )}

      {rest && (
        <RestTimer
          key={rest.id}
          seconds={rest.seconds}
          color={color}
          onClose={() => setRest(null)}
        />
      )}

      {finished && (
        <SessionComplete
          dayTitle={day.title}
          totalSets={totalSets}
          completedSets={summary.completedSets}
          volumeKg={summary.volumeKg}
          durationMin={summary.durationMin}
          color={color}
          onClose={() => setFinished(false)}
        />
      )}
    </div>
  );
}
