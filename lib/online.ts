"use client";

import { useSyncExternalStore } from "react";

/*
 * Everything in this app works offline except the form videos, which stream
 * from YouTube. Components use this to say so plainly instead of showing a
 * dead player.
 */

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

const getSnapshot = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;
// Assume online while prerendering, so the static HTML never bakes in "offline".
const getServerSnapshot = () => true;

/** True when the device reports a network connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
