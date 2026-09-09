"use client";

import BarbellLoader from "./BarbellLoader";
import { lsGet, useStorageTick } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { countDoneRaw } from "@/lib/draft";
import { readLogs, sessionOn } from "@/lib/logs";
import type { ExerciseConfig } from "@/lib/weights";

export default function TodayProgressBar({
  date,
  plates,
  color,
}: {
  date: string;
  plates: { id: string; config: ExerciseConfig }[];
  color: string;
}) {
  const { hydrated } = useStorageTick();
  const total = plates.reduce((n, p) => n + p.config.sets, 0);

  let done = 0;
  if (hydrated) {
    for (const p of plates) {
      done += countDoneRaw(lsGet<unknown>(keys.setlog(date, p.id), null), p.config);
    }
  }

  const finished = hydrated && Boolean(sessionOn(readLogs(), date));
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
