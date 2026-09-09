"use client";

import { useEffect } from "react";
import { week } from "@/lib/plan";
import { parseSets } from "@/lib/sets";
import { getConfig } from "@/lib/weights";
import { migrateLegacyLogs } from "@/lib/logs";

const prescribedSets = (exerciseId: string): number => {
  const cfg = getConfig(exerciseId);
  if (cfg) return cfg.sets;
  const ex = week.flatMap((d) => d.exercises).find((e) => e.id === exerciseId);
  return ex ? parseSets(ex.sets).count : 0;
};

/**
 * Lifts pre-v1 localStorage into coach:logs.v1 on first load after the update.
 * Runs in an effect (never during render) and is a no-op once v1 exists.
 */
export default function StoreMigration() {
  useEffect(() => {
    migrateLegacyLogs(week, prescribedSets);
  }, []);
  return null;
}
