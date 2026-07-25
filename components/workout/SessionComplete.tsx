"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BarbellLoader from "@/components/BarbellLoader";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function SessionComplete({
  dayTitle,
  totalSets,
  completedSets,
  volumeKg,
  durationMin,
  color,
  nextLabel,
  onClose,
}: {
  dayTitle: string;
  totalSets: number;
  completedSets: number;
  volumeKg: number;
  durationMin: number;
  color: string;
  nextLabel: string;
  onClose: () => void;
}) {
  const target = Math.round(volumeKg);
  const [vol, setVol] = useState(0);

  useEffect(() => {
    const dur = prefersReducedMotion() || target <= 0 ? 0 : 1200;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (t - start) / dur);
      setVol(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-iron px-6">
      <div className="w-full max-w-sm text-center">
        <p className="t-cap" style={{ color }}>
          {dayTitle} — done
        </p>
        <h2 className="t-display mt-2">BAR FULLY LOADED</h2>

        <div className="animate-plate-in mx-auto mt-6 max-w-[240px]">
          <BarbellLoader total={totalSets} done={totalSets} color={color} />
        </div>

        <div className="mt-7 rounded-3xl border border-line bg-surface p-5">
          <p className="t-cap">Total volume</p>
          <p className="num mt-1 text-5xl font-bold leading-none" style={{ color }}>
            {vol.toLocaleString("en-IN")}
          </p>
          <p className="num mt-1 text-sm text-muted">kg lifted</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat value={`${completedSets}`} label="sets done" />
            <Stat value={`${durationMin}m`} label="time" />
          </div>
        </div>

        <p className="mt-5 text-sm text-muted">
          Tomorrow: <span className="font-semibold text-ink">{nextLabel}</span>. Go
          home, eat, take creatine.
        </p>

        <Link
          href="/"
          className="mt-5 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl text-base font-bold"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#0a0e14" }}
        >
          Done <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 min-h-[44px] w-full text-sm font-medium text-muted"
        >
          Back to session
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface2 py-3">
      <p className="num text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
