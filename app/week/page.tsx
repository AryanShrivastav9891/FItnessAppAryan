import { plan } from "@/lib/plan";
import { Card, PageTitle, SectionTitle } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import DayCard from "@/components/DayCard";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Full Week — Coach" };

export default function WeekPage() {
  const audit = plan.muscleAudit;
  const recovery = audit[audit.length - 1];
  const rows = audit.slice(0, -1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="5-day split"
        title="Full Week"
        action={
          <HelpSheet
            title="Full week"
            bullets={[
              "Tap any day to see that day's warm-up, lifts and stretch.",
              "Color = that day's plate color. Every muscle comes twice a week.",
              "Below, the 'Muscle Coverage Audit' — proof that no muscle is missed.",
            ]}
          />
        }
      />

      <p className="-mt-3 text-sm leading-relaxed text-muted">
        {plan.meta.split}. Every muscle twice a week.
      </p>

      <div className="flex flex-col gap-3">
        {plan.week.map((day) => (
          <DayCard key={day.id} day={day} />
        ))}

        <Card className="p-5" accent="#4dabf7">
          <p className="t-cap">Sat / Sun</p>
          <h3 className="t-h2 mt-1">REST + WALK</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {plan.weekendRoutine.satSun}
          </p>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Muscle Coverage Audit — proof, not talk</SectionTitle>
        <Card className="px-5">
          <Disclosure summary="Head to toe — which muscle is worked when">
            <ul className="mt-1 flex flex-col gap-2.5 pb-2">
              {rows.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-2xl bg-surface2 p-4 text-sm leading-relaxed text-muted">
              {recovery}
            </p>
          </Disclosure>
        </Card>
      </section>
    </div>
  );
}
