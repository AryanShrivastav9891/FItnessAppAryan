"use client";

import { useSyncExternalStore } from "react";
import { todayKey } from "./date";

/*
 * Offline there is no server to ask what day it is, and the HTML is baked at
 * build time — so anything day-dependent must come from the device clock after
 * hydration, or a precached page freezes on the day it was built. Same shape as
 * the `hydrated` flag in lib/storage.ts: the prerendered HTML stays day-neutral
 * and the real day fills in on the client.
 */

const NOOP_SUBSCRIBE = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

/** False while prerendering and on the first paint, true once hydrated. */
export function useHydrated(): boolean {
  return useSyncExternalStore(NOOP_SUBSCRIBE, getTrue, getFalse);
}

/** Today's YYYY-MM-DD in Asia/Kolkata — null until the device clock is readable. */
export function useTodayKey(): string | null {
  return useHydrated() ? todayKey() : null;
}