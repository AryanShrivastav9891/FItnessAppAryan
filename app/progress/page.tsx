import { plan } from "@/lib/plan";
import { PageTitle } from "@/components/ui";
import ProgressView from "@/components/ProgressView";
import HelpSheet from "@/components/HelpSheet";

export const metadata = { title: "Progress — Coach" };

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle
        kicker="Weight + waist"
        title="Progress"
        action={
          <HelpSheet
            title="Progress"
            bullets={[
              "Add a weight + waist entry every 2 weeks — morning, empty stomach.",
              "The verdict card tells you: On Track, Watch or Adjust.",
              "Stat tiles up top: this week's volume, sessions, streak, best week.",
            ]}
          />
        }
      />
      <ProgressView tracking={plan.tracking} />
    </div>
  );
}
