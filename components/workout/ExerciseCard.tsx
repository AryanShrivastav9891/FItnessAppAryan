"use client";

import { useState } from "react";
import { lsGet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { parseSets, qualifiesForOverload } from "@/lib/sets";
import type { Exercise, LoggedSession } from "@/lib/types";
import { MuscleChips } from "@/components/Chips";
import { Disclosure } from "@/components/Disclosure";
import { ExternalLink } from "@/components/ui";
import SetLogger from "./SetLogger";

export default function ExerciseCard({
  exercise,
  date,
  color,
  overloadRule,
  onStartRest,
}: {
  exercise: Exercise;
  date: string;
  color: string;
  overloadRule: string;
  onStartRest: (seconds: number) => void;
}) {
  const parsed = parseSets(exercise.sets);
  const [showRule, setShowRule] = useState(false);
  const { hydrated } = useStorageTick();

  // Read the previous session's sets (from before today) to decide the badge.
  let overload = false;
  if (hydrated) {
    const log = lsGet<LoggedSession[]>(keys.log(exercise.id), []);
    overload = qualifiesForOverload(log[log.length - 1]?.sets, parsed.repHigh);
  }

  return (
    <article className="rounded-3xl bg-surface p-5 shadow-md">
      <div className="flex items-start gap-4">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            color: '#0a0e14'
          }}
        >
          {exercise.order}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight">{exercise.name}</h3>
          <p className="text-sm font-semibold tabnum" style={{ color }}>
            {exercise.sets}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <MuscleChips
          primary={exercise.primary}
          secondary={exercise.secondary}
          color={color}
        />
      </div>

      <ExerciseImage
        id={exercise.id}
        name={exercise.name}
        primary={exercise.primary}
        color={color}
      />

      {overload && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRule((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6ee7b730, #6ee7b720)',
              color: '#6ee7b7',
              border: '1px solid #6ee7b740'
            }}
          >
            ↑ +2.5 kg badha — coach ka rule
          </button>
          {showRule && (
            <p className="mt-3 rounded-2xl bg-surface2 p-4 text-sm leading-relaxed text-muted">
              {overloadRule}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 divide-y divide-[rgba(255,255,255,0.08)]">
        <Disclosure summary="Form / best position" defaultOpen accent={color}>
          {exercise.form}
        </Disclosure>
        <Disclosure summary="Galti mat karna" tone="warn">
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
        onSetChecked={() => onStartRest(exercise.restSeconds)}
      />

      <div className="mt-4 flex gap-3">
        <ExternalLink
          href={exercise.video}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-surface2 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-surface3 active:scale-95"
        >
          ▶ Video
        </ExternalLink>
        <ExternalLink
          href="https://musclewiki.com"
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-surface2 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-surface3 active:scale-95"
        >
          MuscleWiki
        </ExternalLink>
      </div>
    </article>
  );
}

/**
 * Optional local image at /public/exercises/<id>.jpg. Never hotlinks. Shows a
 * clean muscle-tag placeholder until (and unless) a local image loads.
 */
function ExerciseImage({
  id,
  name,
  primary,
  color,
}: {
  id: string;
  name: string;
  primary: string[];
  color: string;
}) {
  const [ok, setOk] = useState(false);

  return (
    <div className="relative mt-3 aspect-[16/7] overflow-hidden rounded-xl bg-surface2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/exercises/${id}.jpg`}
        alt={ok ? name : ""}
        loading="lazy"
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
        className="h-full w-full object-cover"
        style={{ display: ok ? "block" : "none" }}
      />
      {!ok && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color }}
          >
            {primary[0]}
          </span>
          <span className="text-[10px] text-muted">
            reference: MuscleWiki / Video
          </span>
        </div>
      )}
    </div>
  );
}
