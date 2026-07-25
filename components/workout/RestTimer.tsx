"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.36);
    osc.onended = () => ac.close();
  } catch {
    /* audio blocked — silent */
  }
}

/**
 * Rest countdown as a slide-up panel above the nav. No blocking backdrop, so the
 * exercise list stays scrollable behind it. Parent remounts it (via key) to start.
 */
export default function RestTimer({
  seconds,
  color,
  onClose,
}: {
  seconds: number;
  color: string;
  onClose: () => void;
}) {
  const [added, setAdded] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [done, setDone] = useState(false);
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const target = seconds + added;

  // stamp start once, in an effect (never during render)
  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (startRef.current == null) return;
      const rem = target - Math.floor((Date.now() - startRef.current) / 1000);
      if (rem <= 0) {
        setLeft(0);
        if (!firedRef.current) {
          firedRef.current = true;
          setDone(true);
          beep();
          try {
            navigator.vibrate?.(200);
          } catch {
            /* unsupported */
          }
        }
      } else {
        setLeft(rem);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(id);
  }, [done, onClose]);

  const addThirty = () => {
    if (done) {
      // resume: run a fresh 30s (target = seconds + added = 30)
      firedRef.current = false;
      startRef.current = Date.now();
      setDone(false);
      setAdded(30 - seconds);
    } else {
      setAdded((a) => a + 30);
    }
  };

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const pct = Math.max(0, Math.min(1, left / Math.max(1, target)));
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div
      role="timer"
      aria-live="polite"
      className="fixed inset-x-0 z-40 px-4"
      style={{ bottom: "calc(70px + env(safe-area-inset-bottom))" }}
    >
      <div className="animate-sheet-up mx-auto flex w-full max-w-md items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-lg">
        <div className={`relative h-16 w-16 shrink-0 ${done ? "animate-ring-pulse" : ""}`}>
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="#252a33" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke={done ? "#51cf66" : color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <span className="num absolute inset-0 flex items-center justify-center text-lg font-bold">
            {done ? "0" : `${mm}:${ss}`}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {done ? (
            <p className="text-[15px] font-bold" style={{ color: "#51cf66" }}>
              Rest over — next set!
            </p>
          ) : (
            <>
              <p className="t-cap">Resting</p>
              <p className="text-sm text-muted">Breathe, keep your form.</p>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={addThirty}
            className="num flex h-9 items-center justify-center gap-0.5 rounded-xl bg-surface2 px-3 text-sm font-semibold text-ink active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            30s
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip rest"
            className="flex h-9 items-center justify-center gap-1 rounded-xl bg-surface2 px-3 text-sm font-semibold text-ink active:scale-95"
          >
            <X size={14} strokeWidth={2.5} />
            {done ? "Close" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}
