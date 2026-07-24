"use client";

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
    <div className="flex items-center gap-3 py-3 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className="flex min-h-[48px] flex-1 items-start gap-3 text-left transition-all active:scale-[0.99]"
      >
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all"
          style={{
            background: checked ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'var(--color-surface2)',
            border: checked ? 'none' : '2px solid rgba(255,255,255,0.08)',
            color: checked ? '#0a0e14' : 'transparent',
          }}
        >
          {checked && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m5 12 5 5 9-11"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={`text-base font-semibold ${checked ? "text-muted line-through" : "text-ink"}`}
            >
              {title}
            </span>
            <span className="shrink-0 text-xs text-muted tabnum">{dose}</span>
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">
            {desc}
          </span>
        </span>
      </button>
      <ExternalLink
        href={video}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-muted shadow-sm transition-all hover:bg-surface3 active:scale-95"
      >
        <span aria-hidden>▶</span>
        <span className="sr-only">Video</span>
      </ExternalLink>
    </div>
  );
}
