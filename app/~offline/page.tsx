import Link from "next/link";
import { WifiOff } from "lucide-react";
import { PageTitle, Card } from "@/components/ui";

export const metadata = { title: "Offline — Coach" };

/**
 * The precached fallback for a navigation that misses.
 *
 * Every route in the plan is precached at install, so in practice this only
 * shows for a URL that did not exist in the build the phone downloaded — a typo,
 * a stale bookmark, or a link to a page added in a deploy that has not been
 * fetched yet. Without it those cases render the browser's own offline error and
 * the app looks broken.
 *
 * It must stay a static server component with no data fetching: it has to be
 * prerendered into the export to be precachable at all.
 */
export default function OfflinePage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageTitle kicker="No signal" title="Offline" />

      <Card>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <WifiOff className="h-8 w-8 text-muted" aria-hidden />
          <p className="text-sm text-ink">
            This page isn&apos;t on the phone yet.
          </p>
          <p className="max-w-[28ch] text-[13px] leading-snug text-muted">
            The workouts, diet and rules all work without signal — head back and
            carry on.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-full bg-surface2 px-5 py-2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
          >
            Back to today
          </Link>
        </div>
      </Card>
    </div>
  );
}
