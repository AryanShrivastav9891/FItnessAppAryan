"use client";

import BarbellLoader from "./BarbellLoader";
import { lsGet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import type { LoggedSet, SessionsMap } from "@/lib/types";

export default function TodayProgressBar({
  date,
  plates,
  color,
}: {
  date: string;
  plates: { id: string; count: number }[];
  color: string;
}) {
  const { hydrated } = useStorageTick();
  const total = plates.reduce((n, p) => n + p.count, 0);

  let done = 0;
  if (hydrated) {
    for (const p of plates) {
      const sets = lsGet<LoggedSet[]>(keys.setlog(date, p.id), []);
      done += sets.filter((s) => s.done).length;
    }
  }

  const finished =
    hydrated && Boolean(lsGet<SessionsMap>(keys.sessions, {})[date]);
  const shown = finished ? total : done;

  return (
    <div>
      <BarbellLoader
        total={total}
        done={shown}
        color={color}
        animate={hydrated}
      />
      <p className="mt-1.5 text-xs text-muted">
        <span className="num">{shown}/{total}</span> sets{" "}
        {finished ? "· session complete" : done > 0 ? "loaded" : "— bar is empty"}
      </p>
    </div>
  );
}
