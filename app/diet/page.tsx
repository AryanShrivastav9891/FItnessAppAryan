import { plan } from "@/lib/plan";
import { PageTitle } from "@/components/ui";
import DietView from "@/components/DietView";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Khana — Coach" };

export default function DietPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="Diet + paani"
        title="Khana"
        action={
          <HelpSheet
            title="Khana"
            bullets={[
              "Upar toggle se Regular (non-veg) ya Veg month choose karo — yaad rehta hai.",
              "Har glass tap karke paani track karo — target 8 glass (3–4L).",
              "Protein total neeche dikhta hai. Khaana pehle, phir creatine, phir whey.",
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
