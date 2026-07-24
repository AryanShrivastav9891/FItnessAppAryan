"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import Sheet from "./Sheet";

/** A round help button for a screen header + a 3-bullet "how to use" sheet. */
export default function HelpSheet({
  title,
  bullets,
}: {
  title: string;
  bullets: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ye screen kaise use kare"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:text-ink active:scale-95"
      >
        <CircleHelp size={20} strokeWidth={2} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="help-title">
        <h2 id="help-title" className="t-h2">
          {title}
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs text-muted">
                {i + 1}
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 min-h-[48px] w-full rounded-2xl bg-surface2 text-sm font-semibold text-ink active:scale-[0.99]"
        >
          Samajh gaya
        </button>
      </Sheet>
    </>
  );
}
