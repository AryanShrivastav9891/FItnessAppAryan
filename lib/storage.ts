"use client";

import { useCallback, useSyncExternalStore } from "react";

// Every key is namespaced under "coach:" and stored as JSON. All access is
// SSR-guarded. Reads use useSyncExternalStore so there is no hydration mismatch
// and no setState-in-effect.

const NS = "coach:";
const EVENT = "coach:storage";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function lsSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(NS + key);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
  } catch {
    /* ignore */
  }
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function subscribeStorage(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// A monotonically increasing signal so many-key readers re-render on any change.
let tickVersion = 0;
function subscribeTick(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    tickVersion += 1;
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// Stable module-level snapshots (avoids resubscribing every render).
const NOOP_SUBSCRIBE = () => () => {};
const getTrue = () => true;
const getFalse = () => false;
const getTick = () => tickVersion;
const getZero = () => 0;

/** Reactive, SSR-safe localStorage state for a single key. */
export function useLocalState<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribeStorage,
    () => (typeof window === "undefined" ? null : window.localStorage.getItem(NS + key)),
    () => null,
  );
  const value = raw == null ? fallback : safeParse<T>(raw, fallback);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = lsGet<T>(key, fallback);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(current) : next;
      lsSet(key, resolved);
    },
    [key, fallback],
  );

  const hydrated = useSyncExternalStore(NOOP_SUBSCRIBE, getTrue, getFalse);
  return [value, set, hydrated] as const;
}

/**
 * For components that read MANY keys via lsGet() during render: re-renders on
 * any coach storage change. `hydrated` is false on the server / first paint and
 * true afterwards, so callers can gate localStorage reads to avoid mismatch.
 */
export function useStorageTick(): { hydrated: boolean } {
  useSyncExternalStore(subscribeTick, getTick, getZero);
  const hydrated = useSyncExternalStore(NOOP_SUBSCRIBE, getTrue, getFalse);
  return { hydrated };
}
