"use client";

import Link from "next/link";
import { Play, Dumbbell, Clock, Footprints, Pill } from "lucide-react";
import { plan, getDay, dayColor, DAY_PLATE_KG, musclesForDay } from "@/lib/plan";
import { dayIdForToday, todayKey } from "@/lib/date";
import { useHydrated } from "@/lib/clock";
import { parseSets } from "@/lib/sets";
import { Card } from "@/components/ui";
import { MuscleGlyphRow } from "@/components/Chips";
import TodayProgressBar from "@/components/TodayProgressBar";

function ist(opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    ...opts,
  }).format(new Date());
}

function greetWord(): string {
  const h = Number(ist({ hour: "numeric", hour12: false }));
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/**
 * Which day it is comes from the device clock, so it is only known after
 * hydration — the static HTML ships a skeleton of the same height instead.
 */
export default function TodayHero() {
  const hydrated = useHydrated();
  if (!hydrated) return <HeroSkeleton />;

  const dayId = dayIdForToday();
  const dateLabel = ist({ weekday: "long", day: "numeric", month: "long" });

  return dayId ? (
    <WorkoutHero dayId={dayId} date={todayKey()} dateLabel={dateLabel} />
  ) : (
    <RestHero dateLabel={dateLabel} />
  );
}

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <p className="h-[22px] w-3/4 rounded-lg bg-surface2" />
      <Card accent="#4dabf7" className="p-5">
        <div className="h-3 w-28 rounded bg-surface2" />
        <div className="mt-3 h-7 w-52 rounded-lg bg-surface2" />
        <div className="mt-4 h-9 w-full rounded-xl bg-surface2" />
        <div className="mt-4 h-16 w-full rounded-2xl bg-surface2" />
        <div className="mt-5 h-[56px] w-full rounded-2xl bg-surface2" />
      </Card>
    </div>
  );
}

function WorkoutHero({
  dayId,
  date,
  dateLabel,
}: {
  dayId: string;
  date: string;
  dateLabel: string;
}) {
  const day = getDay(dayId)!;
  const color = dayColor(dayId);
  const shortTitle = day.title.split(/[ (]/)[0];
  const plates = day.exercises.map((e) => ({
    id: e.id,
    count: parseSets(e.sets).count,
  }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-snug text-muted">
        Good {greetWord().toLowerCase()} —{" "}
        <span className="font-semibold" style={{ color }}>
          today is {shortTitle}
        </span>
        . One session, full focus.
      </p>

      <Card accent={color} className="overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">{dateLabel}</p>
            <p className="t-cap mt-0.5" style={{ color }}>
              Today · {day.day}
            </p>
          </div>
          <span
            className="num rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            {DAY_PLATE_KG[dayId]}kg
          </span>
        </div>

        <h1 className="t-display mt-2">{day.title}</h1>

        <div className="mt-3">
          <MuscleGlyphRow primary={musclesForDay(day)} color={color} />
        </div>

        <p className="mt-4 rounded-2xl bg-surface2 p-3.5 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">Crowd-dodge: </span>
          {day.crowdNote}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <Meta icon={<Dumbbell size={13} strokeWidth={2} />}>
            {day.exercises.length} exercises
          </Meta>
          <Meta icon={<Clock size={13} strokeWidth={2} />}>~60–75 min</Meta>
          <Meta icon={<Clock size={13} strokeWidth={2} />}>7:00 PM</Meta>
        </div>

        <div className="mt-5">
          <TodayProgressBar date={date} plates={plates} color={color} />
        </div>

        <Link
          href={`/workout/${dayId}`}
          className="mt-5 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-md transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: "#0a0e14",
          }}
        >
          <Play size={20} strokeWidth={2.5} fill="#0a0e14" />
          Start Workout
        </Link>
      </Card>
    </div>
  );
}

function RestHero({ dateLabel }: { dateLabel: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-snug text-muted">
        <span className="font-semibold text-ink">Rest today</span> — recovery is
        training too.
      </p>

      <Card accent="#4dabf7" className="p-5">
        <p className="text-xs font-medium text-muted">{dateLabel}</p>
        <p className="t-cap mt-0.5" style={{ color: "#4dabf7" }}>
          Rest Day
        </p>
        <h1 className="t-display mt-2">REST</h1>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          {plan.weekendRoutine.satSun}
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          <RestLine icon={<Footprints size={18} strokeWidth={2} />}>
            {plan.weekendRoutine.steps}
          </RestLine>
          <RestLine icon={<Pill size={18} strokeWidth={2} />}>
            Creatine today too — 3–5 g even on rest days.
          </RestLine>
        </ul>

        <Link
          href="/week"
          className="mt-5 flex min-h-[52px] items-center justify-center rounded-2xl bg-surface2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          See the full week
        </Link>
      </Card>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1.5">
      <span className="text-muted">{icon}</span>
      {children}
    </span>
  );
}

function RestLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-muted">
      <span className="mt-0.5 text-[#4dabf7]">{icon}</span>
      <span>{children}</span>
    </li>
  );
}
