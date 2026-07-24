"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Timer, ArrowRight, Check } from "lucide-react";
import { lsGet, lsSet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { todayKey } from "@/lib/date";
import { parseSets } from "@/lib/sets";
import { week as WEEK } from "@/lib/plan";
import type { Day, LoggedSession, LoggedSet, SessionsMap } from "@/lib/types";
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

  const totalSets = day.exercises.reduce((n, e) => n + parseSets(e.sets).count, 0);

  let doneSets = 0;
  if (hydrated) {
    for (const ex of day.exercises) {
      doneSets += lsGet<LoggedSet[]>(keys.setlog(date, ex.id), []).filter((r) => r.done).length;
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
    const startAt = lsGet<number | null>(keys.start(date, day.id), null);
    const durationMin = startAt ? Math.max(1, Math.round((Date.now() - startAt) / 60000)) : 0;
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
    <div className="flex flex-col gap-4">
      {/* sticky mini-header */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-iron/90 px-4 pb-2.5 pt-2 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex h-10 items-center gap-0.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft size={18} strokeWidth={2} /> Aaj
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
                className="flex min-h-[46px] flex-1 flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: active ? `${color}1f` : "var(--color-surface2)",
                  color: active ? "#e8eaed" : "#9aa3b2",
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
            Warm-up done — Lift pe jao <ArrowRight size={18} strokeWidth={2.5} />
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
            Lifts done — Stretch pe jao <ArrowRight size={18} strokeWidth={2.5} />
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
