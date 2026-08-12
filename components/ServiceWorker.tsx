"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpCircle, WifiOff } from "lucide-react";
import { useOnline } from "@/lib/online";

/**
 * Registers the offline worker and owns the two bits of UI that go with it: the
 * "new version" prompt and the offline pill.
 *
 * The update is offered, never forced. `skipWaiting` is off in app/sw.ts, so a
 * new build sits in the waiting state until it is tapped — a deploy can still
 * never swap the JS out from under a workout that is halfway through.
 */
export default function ServiceWorker() {
  const online = useOnline();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // out/sw.js is only produced by `npm run build`; `next dev` has no worker to
    // register, and registering a stale one would fight hot reload.
    if (process.env.NODE_ENV !== "production") return;

    let registration: ServiceWorkerRegistration | undefined;

    /**
     * Ask the browser to exempt this origin from storage eviction.
     *
     * Without it the ~7 MB of exercise photos sit in "best-effort" storage,
     * which the OS is free to clear under pressure — the app would then look
     * installed but come up empty in a basement gym with no signal. On Android
     * this resolves silently against install/engagement heuristics rather than
     * prompting.
     */
    const requestPersistence = async () => {
      if (!navigator.storage?.persist) return;
      try {
        if (await navigator.storage.persisted()) return;
        await navigator.storage.persist();
      } catch {
        // Unsupported or denied — nothing to do, caching still works.
      }
    };

    /**
     * A worker in `installed` state means the bytes are on the device and ready.
     * The `controller` check is what separates an update from a first install:
     * on a first ever visit there is no controller yet, and showing "new version
     * available" to someone who has never seen the old one is nonsense.
     */
    const track = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const check = () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaiting(worker);
        }
      };
      check();
      worker.addEventListener("statechange", check);
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        // Unsupported, blocked, or served over plain http — the app still works,
        // just without offline.
        return;
      }

      void requestPersistence();

      track(registration.waiting);
      registration.addEventListener("updatefound", () => {
        track(registration!.installing);
      });
    };

    // Let the page finish loading first so precaching never competes with it.
    const start = () => void register();
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    // Reopening the app from the home screen is the natural moment to look for a
    // deploy; without this the check only happens on a full page load.
    const recheck = () => {
      if (document.visibilityState === "visible") void registration?.update();
    };
    document.addEventListener("visibilitychange", recheck);

    return () => {
      window.removeEventListener("load", start);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting || reloading.current) return;
    reloading.current = true;

    // The new worker takes over asynchronously. Reload on `controllerchange`
    // rather than straight after posting, so the page that comes back is served
    // by the new worker instead of racing the old one.
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );

    // app/sw.ts sets `skipWaiting: false`; Serwist's own message handler is what
    // picks this up.
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);

  return (
    <>
      {/* The update prompt sits in the same slot, and it is the more urgent of
          the two — never stack them. */}
      {!online && !waiting && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-surface2/95 px-3 py-1.5 text-[12px] font-semibold text-muted shadow-lg backdrop-blur">
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            Offline — everything except form videos still works
          </span>
        </div>
      )}

      {waiting && (
        <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
          <button
            type="button"
            onClick={applyUpdate}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-iron shadow-lg transition-transform active:scale-[0.98]"
          >
            <ArrowUpCircle className="h-4 w-4" aria-hidden />
            New version available — tap to update
          </button>
        </div>
      )}
    </>
  );
}
