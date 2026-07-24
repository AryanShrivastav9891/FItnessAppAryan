"use client";

import { useEffect, useRef, useState } from "react";

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

function vibrate() {
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    /* unsupported */
  }
}

/**
 * A floating rest countdown that sits above the bottom nav and keeps running
 * while the user scrolls. Parent remounts it (via key) to (re)start.
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
  const [left, setLeft] = useState(seconds);
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const rem = seconds - Math.floor((Date.now() - start) / 1000);
      if (rem <= 0) {
        setLeft(0);
        if (!firedRef.current) {
          firedRef.current = true;
          setDone(true);
          beep();
          vibrate();
        }
      } else {
        setLeft(rem);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [seconds]);

  // auto-dismiss a few seconds after it finishes
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(id);
  }, [done, onClose]);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const pct = Math.max(0, Math.min(1, left / seconds));

  return (
    <div
      role="timer"
      aria-live="polite"
      className="fixed inset-x-0 z-30 px-4"
      style={{ bottom: "calc(74px + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface2/95 p-3 shadow-lg backdrop-blur">
        <div className="relative h-10 w-10 shrink-0">
          <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#2b3742" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={done ? "#4ade80" : color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 15}`}
              strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct)}`}
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          {done ? (
            <p className="text-sm font-bold text-success">
              Rest khatam — agla set! 💪
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted">Rest</p>
              <p className="font-mono text-xl font-bold tabnum leading-none">
                {mm}:{ss}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] rounded-xl border border-line px-3 text-sm font-semibold text-ink active:bg-surface"
        >
          {done ? "Band karo" : "Skip"}
        </button>
      </div>
    </div>
  );
}
