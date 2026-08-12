"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { useOnline } from "@/lib/online";
import { Card } from "@/components/ui";

/**
 * The offline switch.
 *
 * A web page cannot switch the phone's radio off, so this does the honest
 * version: it tells the app to stop reaching for the network at all. Every
 * screen already asks `useOnline()` before touching YouTube, so flipping this
 * puts the whole app into the same state a dead signal would — which is also
 * the quickest way to check that a session really will hold up in a basement
 * gym, without digging through DevTools.
 */
export default function OfflineToggle() {
  const [forced, setForced, hydrated] = useLocalState<boolean>(
    keys.offlineMode,
    false,
  );
  const online = useOnline();

  // `forced` is the switch; `online` is the truth after the device is asked too.
  const noSignal = hydrated && !online && !forced;

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setForced((v) => !v)}
        aria-pressed={hydrated ? forced : false}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
          style={{
            backgroundColor: forced ? "#ff6b6b1f" : "var(--color-surface2)",
            color: forced ? "#ff6b6b" : "var(--color-muted)",
          }}
        >
          {forced ? (
            <WifiOff size={18} strokeWidth={2} />
          ) : (
            <Wifi size={18} strokeWidth={2} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink">
            Offline mode
          </span>
          <span className="block text-xs text-muted">
            {!hydrated
              ? " "
              : forced
                ? "On — videos are off, everything else works."
                : noSignal
                  ? "Off — but there's no signal right now anyway."
                  : "Off — form videos will stream."}
          </span>
        </span>

        {/* Switch. Presentational: the whole row is the button. */}
        <span
          aria-hidden
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ backgroundColor: forced ? "#ff6b6b" : "var(--color-surface3)" }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-ink shadow-sm transition-all"
            style={{ left: forced ? "1.375rem" : "0.125rem" }}
          />
        </span>
      </button>
    </Card>
  );
}
