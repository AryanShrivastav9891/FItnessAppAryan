import { plan } from "@/lib/plan";
import { PageTitle } from "@/components/ui";
import DietView from "@/components/DietView";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Food — Coach" };

export default function DietPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="Diet + water"
        title="Food"
        action={
          <HelpSheet
            title="Food"
            bullets={[
              "Use the toggle up top to choose Regular (non-veg) or Veg month — it's remembered.",
              "Tap each glass to track water — target 8 glasses (3–4L).",
              "The protein total shows below. Food first, then creatine, then whey.",
            ]}
          />
        }
      />
      <DietView
        diets={plan.diet}
        supplements={plan.supplements}
        supplementsPriority={plan.supplementsPriority}
      />
    </div>
  );
}
