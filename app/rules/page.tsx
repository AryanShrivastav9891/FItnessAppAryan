import { Check } from "lucide-react";
import { plan } from "@/lib/plan";
import { Card, PageTitle, SectionTitle, ExternalLink } from "@/components/ui";
import { Disclosure } from "@/components/Disclosure";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Rules — Coach" };

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 flex flex-col gap-2 pb-1">
      {items.map((it) => (
        <li key={it} className="flex gap-2 text-[13px] leading-snug text-ink">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

const PROFILE_LABELS: Record<string, string> = {
  name: "Name",
  age: "Age",
  sex: "Sex",
  height: "Height",
  weight: "Weight",
  bodyType: "Body type",
  experience: "Experience",
  goal: "Goal",
  diet: "Diet",
  budget: "Budget",
  gymTime: "Gym time",
  medical: "Medical",
  smoking: "Smoking",
  digestion: "Digestion",
  supplementsOwned: "Supplements paas",
};

export default function RulesPage() {
  const { expectation, lifestyle, references, profile } = plan;

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="The coach's rules"
        title="Rules"
        action={
          <HelpSheet
            title="Rules"
            bullets={[
              "Tap any section to open/close the coach's rules.",
              "'The honest truth' — the realistic 6-month result. Profile at the bottom.",
              "The reference library opens MuscleWiki and YouTube form videos.",
            ]}
          />
        }
      />

      {/* Honest expectation */}
      <Card className="p-5" accent="#ff6b6b">
        <SectionTitle>The honest truth — 5–6 months</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {expectation.honestTruth}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {expectation.results.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-ink">
              <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-surface2 p-3 text-[13px] font-semibold leading-snug">
          {expectation.core}
        </p>
      </Card>

      <Card className="px-4">
        <Disclosure summary="The 3 conditions for the 5-day plan">
          <p className="pb-1">{expectation.fiveDayConditions}</p>
        </Disclosure>
      </Card>

      <Card className="px-4">
        <Disclosure summary="The truth about side belly (spot reduction)" tone="warn">
          <p className="pb-1">{expectation.spotReductionTruth}</p>
        </Disclosure>
      </Card>

      {/* Rule accordions */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Rulebook</SectionTitle>
        <Card className="divide-y divide-line px-4">
          <Disclosure summary="Training rules (every session)" defaultOpen>
            <Bullets items={plan.trainingRules} />
          </Disclosure>
          <Disclosure summary="Universal best position — on every exercise">
            <Bullets items={plan.universalFormRules} />
          </Disclosure>
          <Disclosure summary="Stretching golden rules">
            <Bullets items={plan.stretchingRules} />
          </Disclosure>
          <Disclosure summary="When a machine is busy — 3 rules">
            <Bullets items={plan.crowdDodgeRules} />
          </Disclosure>
        </Card>
      </section>

      {/* Lifestyle */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Cardio · Sleep · Cigarettes</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <div>
            <p className="t-cap">
              Cardio / steps
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink">
              {lifestyle.cardio}
            </p>
          </div>
          <div>
            <p className="t-cap">
              Sleep
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink">
              {lifestyle.sleep}
            </p>
          </div>
          <div>
            <p className="t-cap">
              Cigarette (coach-to-athlete)
            </p>
            <Bullets items={lifestyle.smoking} />
          </div>
        </Card>
      </section>

      {/* References */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Reference library</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[13px] leading-relaxed text-muted">
            {references.muscleWiki}
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            {references.youtube}
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            {references.camera}
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            {references.charts}
          </p>
          <ExternalLink
            href="https://musclewiki.com"
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-line text-sm font-semibold text-ink active:bg-surface2"
          >
            Open MuscleWiki ↗
          </ExternalLink>
        </Card>
      </section>

      {/* Profile */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Profile</SectionTitle>
        <Card className="divide-y divide-line">
          {Object.entries(PROFILE_LABELS).map(([key, label]) => (
            <div key={key} className="flex gap-3 p-3">
              <span className="w-24 shrink-0 text-[12px] font-semibold text-muted">
                {label}
              </span>
              <span className="flex-1 text-[13px] leading-snug text-ink">
                {String(profile[key] ?? "—")}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <p className="pb-2 pt-1 text-center font-display text-lg leading-tight text-muted">
        {plan.closing}
      </p>
    </div>
  );
}
