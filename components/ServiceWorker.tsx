"use client";

import { useEffect } from "react";

/**
 * Registers the offline worker. On the first visit with any network at all it
 * pulls the whole app down; after that the app opens with no signal.
 *
 * Registration is deliberately quiet: no update prompt, no forced reload. A new
 * build installs in the background and takes over the next time the app is
 * opened fresh, so a deploy can never interrupt a workout mid-session.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // The worker only exists in a real build (`next dev` never emits out/sw.js).
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Unsupported, blocked, or served over plain http — the app still works,
        // just without offline.
      });
    };

    // Let the page finish loading first so precaching never competes with it.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
