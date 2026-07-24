"use client";

import { useEffect } from "react";
import { RENDER_COUNTS, EXPECTED_COUNTS } from "@/lib/plan";

// Dev-only self-check: yells in the console if the data ever drifts.
export default function DebugAssert() {
  useEffect(() => {
    console.assert(
      RENDER_COUNTS.exercises === EXPECTED_COUNTS.exercises,
      `Coach: exercises ${RENDER_COUNTS.exercises} !== ${EXPECTED_COUNTS.exercises}`,
    );
    console.assert(
      RENDER_COUNTS.warmups === EXPECTED_COUNTS.warmups,
      `Coach: warmups ${RENDER_COUNTS.warmups} !== ${EXPECTED_COUNTS.warmups}`,
    );
    console.assert(
      RENDER_COUNTS.stretches === EXPECTED_COUNTS.stretches,
      `Coach: stretches ${RENDER_COUNTS.stretches} !== ${EXPECTED_COUNTS.stretches}`,
    );
    console.assert(
      RENDER_COUNTS.meals === EXPECTED_COUNTS.meals,
      `Coach: meals ${RENDER_COUNTS.meals} !== ${EXPECTED_COUNTS.meals}`,
    );
  }, []);
  return null;
}
