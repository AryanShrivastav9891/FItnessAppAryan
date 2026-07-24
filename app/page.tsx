import Link from "next/link";
import { plan, getDay, dayColor, DAY_PLATE_KG } from "@/lib/plan";
import { dayIdForToday, todayKey } from "@/lib/date";
import { parseSets } from "@/lib/sets";
import { Card, SectionTitle, TileLink } from "@/components/ui";
import StreakStrip from "@/components/StreakStrip";
import ReminderChips from "@/components/ReminderChips";
import TodayProgressBar from "@/components/TodayProgressBar";
import MissTwiceBanner from "@/components/MissTwiceBanner";

// Day detection must reflect the real current day, not build time.
export const dynamic = "force-dynamic";

function istLongDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function Home() {
  const dayId = dayIdForToday();
  const today = todayKey();
  const dateLabel = istLongDate();

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* wordmark */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="font-display text-3xl leading-none">COACH</p>
          <p className="text-xs text-muted">6-mahine ka mission</p>
        </div>
        <Link
          href="/rules"
          className="rounded-full bg-surface px-4 py-2 text-xs font-medium text-ink shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          Rules
        </Link>
      </div>

      {dayId ? (
        <WorkoutHero dayId={dayId} date={today} dateLabel={dateLabel} />
      ) : (
        <RestHero dateLabel={dateLabel} />
      )}

      <MissTwiceBanner mindset={plan.tracking.mindset} />

      <section className="flex flex-col gap-3">
        <SectionTitle>Pichle 14 din</SectionTitle>
        <Card className="p-4">
          <StreakStrip />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Aaj ke reminders</SectionTitle>
        <ReminderChips />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Jaldi se</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <TileLink
            href="/week"
            label="Poora Hafta"
            sub="5-day split"
            icon={<GridIcon />}
          />
          <TileLink
            href="/diet"
            label="Khana"
            sub="Diet + paani"
            icon={<PlateIcon />}
          />
          <TileLink
            href="/progress"
            label="Progress"
            sub="Weight + waist"
            icon={<ChartIcon />}
          />
          <TileLink
            href="/rules"
            label="Rules"
            sub="Coach ke usool"
            icon={<BookIcon />}
          />
        </div>
      </section>
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
  const plates = day.exercises.map((e) => ({
    id: e.id,
    count: parseSets(e.sets).count,
  }));

  return (
    <Card accent={color} className="overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted">{dateLabel}</p>
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color }}
          >
            Aaj · {day.day}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${color}40, ${color}20)`,
            color,
            border: `1px solid ${color}30`
          }}
        >
          {DAY_PLATE_KG[dayId]}kg
        </span>
      </div>

      <h1 className="mt-2 font-display text-5xl leading-tight">{day.title}</h1>

      <p className="mt-4 rounded-2xl bg-surface2/50 p-4 text-sm leading-relaxed text-muted backdrop-blur-sm">
        <span className="font-semibold text-ink">Crowd-dodge: </span>
        {day.crowdNote}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <Meta>{day.exercises.length} exercises</Meta>
        <Meta>~60–75 min</Meta>
        <Meta>7:00–8:15 PM</Meta>
      </div>

      <div className="mt-5">
        <TodayProgressBar date={date} plates={plates} color={color} />
      </div>

      <Link
        href={`/workout/${dayId}`}
        className="mt-5 flex min-h-[56px] items-center justify-center rounded-2xl text-base font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
        style={{ 
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          color: '#0a0e14'
        }}
      >
        Workout Shuru Karo →
      </Link>
    </Card>
  );
}

function RestHero({ dateLabel }: { dateLabel: string }) {
  return (
    <Card className="p-5" accent="#8e95a3">
      <p className="text-xs font-medium text-muted">{dateLabel}</p>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Rest Day
      </p>
      <h1 className="mt-2 font-display text-5xl leading-tight">AARAM</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {plan.weekendRoutine.satSun}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        <RestLine icon="🚶">{plan.weekendRoutine.steps}</RestLine>
        <RestLine icon="🧴">{plan.weekendRoutine.daily}</RestLine>
        <RestLine icon="💊">Creatine aaj bhi — rest day bhi 3–5 g.</RestLine>
      </ul>

      <Link
        href="/week"
        className="mt-5 flex min-h-[52px] items-center justify-center rounded-2xl bg-surface2 text-sm font-semibold text-ink shadow-md transition-all hover:bg-surface3 active:scale-[0.98]"
      >
        Poora hafta dekho
      </Link>
    </Card>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface2/50 px-3 py-1.5 backdrop-blur-sm">
      {children}
    </span>
  );
}

function RestLine({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-muted">
      <span className="text-lg" aria-hidden>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[9px] text-muted">
      <span className="flex items-center gap-1">
        <i className="h-2.5 w-2.5 rounded-sm bg-success" /> done
      </span>
      <span className="flex items-center gap-1">
        <i className="h-2.5 w-2.5 rounded-sm border border-[#d6454577]" /> miss
      </span>
      <span className="flex items-center gap-1">
        <i className="h-2.5 w-2.5 rounded-sm bg-surface2" /> rest
      </span>
    </div>
  );
}

/* --- tile icons --- */
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function PlateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5m0 14h16M7 15l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
