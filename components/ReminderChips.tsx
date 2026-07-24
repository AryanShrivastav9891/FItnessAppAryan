"use client";

import Link from "next/link";
import { useLocalState } from "@/lib/storage";
import { todayKey } from "@/lib/date";

export default function ReminderChips() {
  const today = todayKey();
  const [creatineDone, setCreatineDone] = useLocalState<boolean>(
    `creatine:${today}`,
    false,
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setCreatineDone((v) => !v)}
        aria-pressed={creatineDone}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors"
        style={{
          borderColor: creatineDone ? "#4ade8066" : "#2b3742",
          backgroundColor: creatineDone ? "#4ade8022" : "transparent",
          color: creatineDone ? "#4ade80" : "#f2f4f6",
        }}
      >
        <span aria-hidden>{creatineDone ? "✓" : "○"}</span>
        Creatine 3–5g {creatineDone ? "done" : "aaj?"}
      </button>

      <Link
        href="/diet"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line px-3 text-sm font-medium text-ink transition-colors active:bg-surface2"
      >
        💧 Paani 3–4L
      </Link>

      <span className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line px-3 text-sm font-medium text-muted">
        😴 Neend 11:30 tak
      </span>
    </div>
  );
}
