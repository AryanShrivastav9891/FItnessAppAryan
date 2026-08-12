"use client";

import { useSyncExternalStore } from "react";

/*
 * Everything in this app works offline except the form videos, which stream
 * from YouTube. Components use this to say so plainly instead of showing a
 * dead player.
 *
 * Two things can make the app "offline": the device losing signal, and the
 * offline switch on the home screen. The switch is a real preference, not a
 * simulation — a page cannot cut its own network, so what it actually does is
 * stop the app reaching for YouTube at all. On gym wifi that is the difference
 * between a session that never stalls and one that waits on a dead player.
 */

/** localStorage key, already namespaced the way lib/storage.ts writes it. */
const FORCED_KEY = "coach:offlineMode";
const STORAGE_EVENT = "coach:storage";

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  window.addEventListener(STORAGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
    window.removeEventListener(STORAGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** True when the user has flipped the switch on the home screen. */
export function isForcedOffline(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FORCED_KEY) === "true";
  } catch {
    return false;
  }
}

const getSnapshot = () => {
  if (typeof navigator === "undefined") return true;
  if (isForcedOffline()) return false;
  return navigator.onLine;
};
// Assume online while prerendering, so the static HTML never bakes in "offline".
const getServerSnapshot = () => true;

/** True when the device reports a network connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
