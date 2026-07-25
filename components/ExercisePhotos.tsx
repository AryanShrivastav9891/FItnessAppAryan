"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import Sheet from "./Sheet";

function label(i: number, total: number): string {
  if (total <= 1) return "";
  if (i === 0) return "START";
  if (i === total - 1) return "END";
  return `${i + 1}`;
}

export default function ExercisePhotos({
  name,
  images,
  instructions = [],
  color,
  variant = "grid",
}: {
  name: string;
  images: string[];
  instructions?: string[];
  color: string;
  variant?: "grid" | "thumb";
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  return (
    <>
      {variant === "grid" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {images.slice(0, 2).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAt(i)}
              className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm transition-transform active:scale-[0.98]"
            >
              <img src={src} alt={`${name} — ${label(i, images.length).toLowerCase() || "demo"}`} className="h-full w-full object-cover" loading="lazy" />
              {label(i, images.length) && (
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: "rgba(10,14,20,0.72)" }}
                >
                  {label(i, images.length)}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`${name} photos`}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm transition-transform active:scale-95"
        >
          <img src={images[0]} alt={`${name} demo`} className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute inset-0 flex items-end justify-end p-0.5">
            <ImageIcon size={11} className="text-white drop-shadow" />
          </span>
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="photo-title">
        <h2 id="photo-title" className="t-h2 pr-8">
          {name}
        </h2>
        <div className="relative mt-3 aspect-square overflow-hidden rounded-2xl bg-white">
          <img src={images[idx]} alt={`${name} — step ${idx + 1}`} className="h-full w-full object-contain" />
          {label(idx, images.length) && (
            <span
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {label(idx, images.length)}
            </span>
          )}
          {images.length > 1 && (
            <>
              <IconBtn side="left" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}>
                <ChevronLeft size={20} />
              </IconBtn>
              <IconBtn side="right" onClick={() => setIdx((i) => (i + 1) % images.length)}>
                <ChevronRight size={20} />
              </IconBtn>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === idx ? 18 : 6, backgroundColor: i === idx ? color : "var(--color-surface3)" }}
              />
            ))}
          </div>
        )}

        {instructions.length > 0 && (
          <div className="mt-4">
            <p className="t-cap">How to do it</p>
            <ol className="mt-2 flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs" style={{ color }}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 min-h-[48px] w-full rounded-2xl bg-surface2 text-sm font-semibold text-ink active:scale-[0.99]"
        >
          Close
        </button>
      </Sheet>
    </>
  );
}

function IconBtn({
  side,
  onClick,
  children,
}: {
  side: "left" | "right";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous" : "Next"}
      className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: "rgba(10,14,20,0.6)", [side]: 8 }}
    >
      {children}
    </button>
  );
}
