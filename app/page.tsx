import Link from "next/link";
import {
  Play,
  Dumbbell,
  Clock,
  CalendarDays,
  UtensilsCrossed,
  TrendingUp,
  ScrollText,
  Footprints,
  Pill,
} from "lucide-react";
import { plan, getDay, dayColor, DAY_PLATE_KG, musclesForDay } from "@/lib/plan";
import { dayIdForToday, todayKey } from "@/lib/date";
import { parseSets } from "@/lib/sets";
import { Card, SectionTitle, TileLink } from "@/components/ui";
import { MuscleGlyphRow } from "@/components/Chips";
import StreakStrip from "@/components/StreakStrip";
import Daily3 from "@/components/Daily3";
import TodayProgressBar from "@/components/TodayProgressBar";
import MissTwiceBanner from "@/components/MissTwiceBanner";
import HelpSheet from "@/components/HelpSheet";

// Day detection must reflect the real current day, not build time.
export const dynamic = "force-dynamic";

function ist(opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    ...opts,
  }).format(new Date());
}

function greetWord(): string {
  const h = Number(ist({ hour: "numeric", hour12: false }));
  if (h < 12) return "Subah";
  if (h < 17) return "Dopahar";
  return "Shaam";
}

export default function Home() {
  const dayId = dayIdForToday();
  const today = todayKey();
  const dateLabel = ist({ weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* wordmark + help */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="font-display text-2xl leading-none">COACH</p>
          <p className="text-xs text-muted">6-mahine ka mission</p>
        </div>
        <HelpSheet
          title="Aaj ka plan"
          bullets={[
            "Aaj ka workout upar hai — 'Workout Shuru Karo' dabao aur seedha session mein.",
            "Daily 3 mark karo: creatine, paani, neend. Ye teen roz ka base hai.",
            "Hafte ki ring strip pe tap karke poora split dekho.",
          ]}
        />
      </div>

      {dayId ? (
        <WorkoutHero dayId={dayId} date={today} dateLabel={dateLabel} />
      ) : (
        <RestHero dateLabel={dateLabel} />
      )}

      <MissTwiceBanner mindset={plan.tracking.mindset} />

      <section className="flex flex-col gap-3">
        <SectionTitle>Is hafte</SectionTitle>
        <Card className="p-4">
          <StreakStrip />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Daily 3 — roz ka base</SectionTitle>
        <Daily3 />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Jaldi se</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <TileLink href="/week" label="Poora Hafta" sub="5-day split" accent="#4dabf7" icon={<CalendarDays size={20} strokeWidth={2} />} />
          <TileLink href="/diet" label="Khana" sub="Diet + paani" accent="#51cf66" icon={<UtensilsCrossed size={20} strokeWidth={2} />} />
          <TileLink href="/progress" label="Progress" sub="Weight + waist" accent="#b197fc" icon={<TrendingUp size={20} strokeWidth={2} />} />
          <TileLink href="/rules" label="Rules" sub="Coach ke usool" accent="#ffd43b" icon={<ScrollText size={20} strokeWidth={2} />} />
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
  const shortTitle = day.title.split(/[ (]/)[0];
  const plates = day.exercises.map((e) => ({
    id: e.id,
    count: parseSets(e.sets).count,
  }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-snug text-muted">
        Chal, {greetWord().toLowerCase()} —{" "}
        <span className="font-semibold" style={{ color }}>
          aaj {shortTitle} hai
        </span>
        . Ek session, poora focus.
      </p>

      <Card accent={color} className="overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">{dateLabel}</p>
            <p className="t-cap mt-0.5" style={{ color }}>
              Aaj · {day.day}
            </p>
          </div>
          <span
            className="num rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: `${color}1f`, color }}
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
          Workout Shuru Karo
        </Link>
      </Card>
    </div>
  );
}

function RestHero({ dateLabel }: { dateLabel: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-snug text-muted">
        <span className="font-semibold text-ink">Aaj rest</span> — recovery bhi
        training hai.
      </p>

      <Card accent="#4dabf7" className="p-5">
        <p className="text-xs font-medium text-muted">{dateLabel}</p>
        <p className="t-cap mt-0.5" style={{ color: "#4dabf7" }}>
          Rest Day
        </p>
        <h1 className="t-display mt-2">AARAM</h1>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          {plan.weekendRoutine.satSun}
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          <RestLine icon={<Footprints size={18} strokeWidth={2} />}>
            {plan.weekendRoutine.steps}
          </RestLine>
          <RestLine icon={<Pill size={18} strokeWidth={2} />}>
            Creatine aaj bhi — rest day bhi 3–5 g.
          </RestLine>
        </ul>

        <Link
          href="/week"
          className="mt-5 flex min-h-[52px] items-center justify-center rounded-2xl bg-surface2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          Poora hafta dekho
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
