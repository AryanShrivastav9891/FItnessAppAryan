import {
  CalendarDays,
  UtensilsCrossed,
  TrendingUp,
  ScrollText,
} from "lucide-react";
import { plan } from "@/lib/plan";
import { Card, SectionTitle, TileLink } from "@/components/ui";
import StreakStrip from "@/components/StreakStrip";
import Daily3 from "@/components/Daily3";
import TodayHero from "@/components/TodayHero";
import MissTwiceBanner from "@/components/MissTwiceBanner";
import HelpSheet from "@/components/HelpSheet";
import OfflineToggle from "@/components/OfflineToggle";

// This page is fully static so it can be precached and opened with no network.
// Everything that depends on "which day is it" lives in <TodayHero>, which reads
// the device clock after hydration.

export default function Home() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* wordmark + help */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="font-display text-2xl leading-none">COACH</p>
          <p className="text-xs text-muted">6-month mission</p>
        </div>
        <HelpSheet
          title="Today's plan"
          bullets={[
            "Today's workout is up top — tap 'Start Workout' to jump straight into the session.",
            "Mark the Daily 3: creatine, water, sleep. These three are the daily base.",
            "Tap the week's ring strip to see the full split.",
          ]}
        />
      </div>

      <TodayHero />

      <MissTwiceBanner mindset={plan.tracking.mindset} />

      <section className="flex flex-col gap-3">
        <SectionTitle>This week</SectionTitle>
        <Card className="p-4">
          <StreakStrip />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Daily 3 — the daily base</SectionTitle>
        <Daily3 />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Signal</SectionTitle>
        <OfflineToggle />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Quick links</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <TileLink href="/week" label="Full Week" sub="5-day split" accent="#4dabf7" icon={<CalendarDays size={20} strokeWidth={2} />} />
          <TileLink href="/diet" label="Food" sub="Diet + water" accent="#51cf66" icon={<UtensilsCrossed size={20} strokeWidth={2} />} />
          <TileLink href="/progress" label="Progress" sub="Weight + waist" accent="#b197fc" icon={<TrendingUp size={20} strokeWidth={2} />} />
          <TileLink href="/rules" label="Rules" sub="The coach's rules" accent="#ffd43b" icon={<ScrollText size={20} strokeWidth={2} />} />
        </div>
      </section>
    </div>
  );
}
