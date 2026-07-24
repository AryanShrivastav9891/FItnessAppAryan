"use client";

import Link from "next/link";
import BarbellLoader from "@/components/BarbellLoader";

const CONFETTI_COLORS = [
  "#D64545",
  "#3B6FD6",
  "#E8C33C",
  "#3FA463",
  "#EDEDED",
  "#4ADE80",
];

// Deterministic-ish spread without needing a seed library.
const PIECES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 9) * 0.14,
  duration: 1.6 + ((i * 13) % 12) / 10,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + ((i * 7) % 6),
}));

export default function SessionComplete({
  dayTitle,
  totalSets,
  completedSets,
  volumeKg,
  durationMin,
  color,
  onClose,
}: {
  dayTitle: string;
  totalSets: number;
  completedSets: number;
  volumeKg: number;
  durationMin: number;
  color: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-iron/95 px-6 backdrop-blur">
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PIECES.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-[2px]"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>

      <div className="animate-drop-in relative w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color }}
        >
          {dayTitle} — done
        </p>
        <h2 className="mt-1 font-display text-4xl leading-none">
          BAR FULLY LOADED
        </h2>

        <div className="mx-auto mt-5 max-w-[220px]">
          <BarbellLoader total={totalSets} done={totalSets} color={color} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat value={`${completedSets}`} label="sets done" />
          <Stat value={`${Math.round(volumeKg)}`} label="kg volume" />
          <Stat value={`${durationMin}`} label="minutes" />
        </div>

        <p className="mt-5 text-[13px] leading-snug text-muted">
          Never miss twice. Ab ghar ja, khaana khaa, creatine le. 💪
        </p>

        <Link
          href="/"
          className="mt-5 flex min-h-[52px] items-center justify-center rounded-2xl text-base font-bold text-iron"
          style={{ backgroundColor: color }}
        >
          Ho gaya
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 min-h-[40px] w-full text-[13px] font-medium text-muted"
        >
          Session mein wapas jao
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-surface2 py-3">
      <p className="font-display text-2xl leading-none tabnum">{value}</p>
      <p className="mt-1 text-[10px] text-muted">{label}</p>
    </div>
  );
}
