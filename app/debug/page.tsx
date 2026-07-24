import { plan, RENDER_COUNTS, EXPECTED_COUNTS } from "@/lib/plan";
import { Card, PageTitle, SectionTitle } from "@/components/ui";
import DebugAssert from "@/components/DebugAssert";

export const metadata = { title: "Debug — Coach" };

export default function DebugPage() {
  const checks = [
    {
      label: "Exercises",
      got: RENDER_COUNTS.exercises,
      want: EXPECTED_COUNTS.exercises,
    },
    {
      label: "Warm-up items",
      got: RENDER_COUNTS.warmups,
      want: EXPECTED_COUNTS.warmups,
    },
    {
      label: "Static stretches",
      got: RENDER_COUNTS.stretches,
      want: EXPECTED_COUNTS.stretches,
    },
    { label: "Meal rows", got: RENDER_COUNTS.meals, want: EXPECTED_COUNTS.meals },
  ];
  const allPass = checks.every((c) => c.got === c.want);

  return (
    <div className="flex flex-col gap-5">
      <DebugAssert />
      <PageTitle kicker="Self-check" title="Debug" />

      <Card
        className="p-4"
        accent={allPass ? "#4ade80" : "#D64545"}
      >
        <p
          className="font-display text-2xl"
          style={{ color: allPass ? "#4ade80" : "#D64545" }}
        >
          {allPass ? "ALL COUNTS PASS ✓" : "COUNT MISMATCH ✗"}
        </p>
        <div className="mt-3 divide-y divide-line">
          {checks.map((c) => {
            const ok = c.got === c.want;
            return (
              <div
                key={c.label}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-muted">{c.label}</span>
                <span
                  className="tabnum font-semibold"
                  style={{ color: ok ? "#4ade80" : "#D64545" }}
                >
                  {c.got} / {c.want} {ok ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionTitle>Per-day breakdown</SectionTitle>
        <Card className="divide-y divide-line">
          {plan.week.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-3 text-sm"
            >
              <span className="font-semibold">{d.title}</span>
              <span className="text-[12px] text-muted tabnum">
                {d.warmup.length} wu · {d.exercises.length} ex · {d.static.length}{" "}
                st
              </span>
            </div>
          ))}
        </Card>
      </section>

      <p className="text-[12px] leading-relaxed text-muted">
        Counts derive from <code>data/plan.json</code>. Open the console for the
        matching <code>console.assert</code> checks. Preserve order + ids when
        editing the JSON.
      </p>
    </div>
  );
}
