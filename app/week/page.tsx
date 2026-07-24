import { plan } from "@/lib/plan";
import { Card, PageTitle, SectionTitle } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import DayCard from "@/components/DayCard";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Poora Hafta — Coach" };

export default function WeekPage() {
  const audit = plan.muscleAudit;
  const recovery = audit[audit.length - 1];
  const rows = audit.slice(0, -1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="5-day split"
        title="Poora Hafta"
        action={
          <HelpSheet
            title="Poora hafta"
            bullets={[
              "Har din pe tap karke us din ka warm-up, lifts aur stretch dekho.",
              "Rang = us din ka plate color. Har muscle hafte mein 2 baar aata hai.",
              "Neeche 'Muscle Coverage Audit' — proof ki koi muscle chhoota nahi.",
            ]}
          />
        }
      />

      <p className="-mt-3 text-sm leading-relaxed text-muted">
        {plan.meta.split}. Har muscle hafte mein 2 baar.
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
        <SectionTitle>Muscle Coverage Audit — proof, hawa nahi</SectionTitle>
        <Card className="px-5">
          <Disclosure summary="Sar se pair tak — kaun muscle kab lagta hai">
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
