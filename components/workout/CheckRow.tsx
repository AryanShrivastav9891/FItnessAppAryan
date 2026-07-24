"use client";

import { Check, Play } from "lucide-react";
import { ExternalLink } from "@/components/ui";

export default function CheckRow({
  checked,
  onToggle,
  title,
  dose,
  desc,
  video,
  color,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  dose: string;
  desc: string;
  video: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className="flex min-h-[48px] flex-1 items-start gap-3 text-left transition-transform active:scale-[0.99]"
      >
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={
            checked
              ? { backgroundColor: color, color: "#0a0e14" }
              : { border: "2px solid var(--color-surface3)", color: "transparent" }
          }
        >
          {checked && (
            <span className="animate-check-pop">
              <Check size={16} strokeWidth={3} aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={`text-[15px] font-semibold ${checked ? "text-muted line-through" : "text-ink"}`}
            >
              {title}
            </span>
            <span className="num shrink-0 text-xs text-muted">{dose}</span>
          </span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">
            {desc}
          </span>
        </span>
      </button>
      <ExternalLink
        href={video}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-muted transition-transform active:scale-95"
      >
        <Play size={16} strokeWidth={2.5} fill="currentColor" />
        <span className="sr-only">Video dekho</span>
      </ExternalLink>
    </div>
  );
}
