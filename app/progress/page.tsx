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
              "Har 2 hafte weight + waist ki entry add karo — subah khaali pet.",
              "Verdict card batata hai: On Track, Watch ya Adjust.",
              "Stat tiles upar: is hafte ka volume, sessions, streak, best week.",
            ]}
          />
        }
      />
      <ProgressView tracking={plan.tracking} />
    </div>
  );
}
