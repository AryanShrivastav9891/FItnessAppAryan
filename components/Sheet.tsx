"use client";

import { useEffect } from "react";

/**
 * Bottom sheet primitive: dim backdrop + slide-up panel, Esc to close, safe-area
 * aware. The list behind stays in place; only the backdrop intercepts taps.
 */
export default function Sheet({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Band karo"
        onClick={onClose}
        className="animate-backdrop-in absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-sheet-up relative w-full max-w-md rounded-t-3xl border-t border-line bg-surface px-5 pt-3 shadow-lg"
        style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface3" />
        {children}
      </div>
    </div>
  );
}
