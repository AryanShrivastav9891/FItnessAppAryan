"use client";

import { Flame } from "lucide-react";
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
    <div className="flex items-start gap-3 rounded-3xl border border-[#ff6b6b33] bg-[#ff6b6b14] p-4">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "#ff6b6b26", color: "#ff6b6b" }}
      >
        <Flame size={18} strokeWidth={2} />
      </span>
      <div>
        <p className="t-cap" style={{ color: "#ff6b6b" }}>
          Missed yesterday
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{mindset}</p>
      </div>
    </div>
  );
}
