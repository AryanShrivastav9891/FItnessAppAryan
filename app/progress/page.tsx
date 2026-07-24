import { plan } from "@/lib/plan";
import { PageTitle } from "@/components/ui";
import ProgressView from "@/components/ProgressView";

export const metadata = { title: "Progress — Coach" };

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle kicker="Weight + waist" title="Progress" />
      <ProgressView tracking={plan.tracking} />
    </div>
  );
}
