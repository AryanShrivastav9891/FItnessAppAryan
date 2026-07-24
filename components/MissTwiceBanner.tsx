"use client";

import { lsGet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { dayIdForKey, yesterdayKey } from "@/lib/date";
import type { SessionsMap } from "@/lib/types";

export default function MissTwiceBanner({ mindset }: { mindset: string }) {
  const { hydrated } = useStorageTick();
  if (!hydrated) return null;

  const y = yesterdayKey();
  const yesterdayWasTraining = dayIdForKey(y) !== null;
  const sessions = lsGet<SessionsMap>(keys.sessions, {});
  const missedYesterday = yesterdayWasTraining && !sessions[y];
  if (!missedYesterday) return null;

  return (
    <div className="rounded-2xl border border-[#d6454566] bg-[#d6454514] p-3">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "#F2B84B" }}
      >
        ⚠ Kal miss hua
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{mindset}</p>
    </div>
  );
}
