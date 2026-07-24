import { plan } from "@/lib/plan";
import { PageTitle } from "@/components/ui";
import DietView from "@/components/DietView";

export const metadata = { title: "Khana — Coach" };

export default function DietPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle kicker="Diet + paani" title="Khana" />
      <DietView
        diets={plan.diet}
        supplements={plan.supplements}
        supplementsPriority={plan.supplementsPriority}
      />
    </div>
  );
}
