import { plan } from "@/lib/plan";
import { PageTitle } from "@/components/ui";
import ProgressView from "@/components/ProgressView";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Progress — Coach" };

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="Strength + body"
        title="Progress"
        action={
          <HelpSheet
            title="Progress"
            bullets={[
              "Stat tiles up top: this week's volume, best week, sessions and missed days this month.",
              "Strength charts plot the best set of each session, with a dashed estimated 1RM.",
              "Add a weight + waist entry every 2 weeks — morning, empty stomach.",
              "Export JSON after a good week — that file is the only backup there is.",
            ]}
          />
        }
      />
      <ProgressView tracking={plan.tracking} />
    </div>
  );
}
