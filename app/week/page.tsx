import { plan } from "@/lib/plan";
import { Card, PageTitle, SectionTitle } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import DayCard from "@/components/DayCard";

export const metadata = { title: "Poora Hafta — Coach" };

export default function WeekPage() {
  const audit = plan.muscleAudit;
  const recovery = audit[audit.length - 1];
  const rows = audit.slice(0, -1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle kicker="5-day split" title="Poora Hafta" />

      <p className="-mt-3 text-sm leading-relaxed text-muted">
        {plan.meta.split}. Har muscle hafte mein 2 baar.
      </p>

      <div className="flex flex-col gap-4">
        {plan.week.map((day) => (
          <DayCard key={day.id} day={day} />
        ))}

        <Card className="p-5" accent="#8e95a3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Sat / Sun
          </p>
          <h3 className="font-display text-3xl leading-tight">REST + WALK</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {plan.weekendRoutine.satSun}
          </p>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Muscle Coverage Audit — proof, hawa nahi</SectionTitle>
        <Card className="px-5">
          <Disclosure summary="Sar se pair tak — kaun muscle kab lagta hai">
            <ul className="mt-2 flex flex-col gap-2.5 pb-2">
              {rows.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-ink">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl bg-surface2 p-4 text-sm leading-relaxed text-muted">
              {recovery}
            </p>
          </Disclosure>
        </Card>
      </section>
    </div>
  );
}
