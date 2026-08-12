"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Play, WifiOff, Search, ChevronDown, Zap } from "lucide-react";
import { getVideo, getClips } from "@/lib/videos";
import { getImages } from "@/lib/images";
import { useOnline } from "@/lib/online";
import { ExternalLink } from "@/components/ui";

/**
 * The form video, playing inline on the workout page.
 *
 * One full-length walkthrough in the big player, plus up to three shorts — the
 * 30-second "just show me the movement" clips you actually want between sets.
 * Tapping a short swaps it into the same player rather than opening a second
 * one, so only ever one YouTube iframe exists per exercise.
 *
 * Nothing loads from YouTube until something is tapped: until then this is the
 * exercise's own local photo, which works with no signal. That keeps a session
 * with 6 exercises from pulling in 6 players, and keeps the page honest offline
 * — where it says so rather than showing a dead frame.
 *
 * The parent owns the open/closed state, because each caller already has its
 * own styled trigger button.
 */
export default function FormVideo({
  id,
  name,
  color,
  searchUrl,
}: {
  id: string;
  name: string;
  color: string;
  searchUrl: string;
}) {
  const video = getVideo(id);
  const clips = getClips(id);
  const online = useOnline();
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Never resolved to a real video id — fall back to the plain search link.
  if (!video) {
    return (
      <div className="mt-3 rounded-2xl bg-surface2 p-4 text-center">
        <p className="text-sm text-muted">No video saved for this one.</p>
        <ExternalLink
          href={searchUrl}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color }}
        >
          <Search size={14} strokeWidth={2.5} /> Search YouTube
        </ExternalLink>
      </div>
    );
  }

  const poster = getImages(id)?.images?.[0] ?? null;
  const current = clips[selected] ?? clips[0];
  const shorts = clips.filter((c) => c.kind === "short");
  const watchUrl = `https://www.youtube.com/watch?v=${current.videoId}`;

  /** Swap the player over to another clip and start it. */
  const pick = (index: number) => {
    if (!online) return;
    setSelected(index);
    setPlaying(true);
    setPickerOpen(false);
  };

  return (
    <div className="mt-3">
      {/* ---- the big player ------------------------------------------------ */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-surface2 shadow-sm ${
          playing && current.kind === "short" ? "aspect-[9/16]" : "aspect-video"
        }`}
      >
        {playing ? (
          <iframe
            // `key` forces a fresh iframe when the clip changes; without it the
            // embed keeps playing the previous video behind the new src.
            key={current.videoId}
            src={`https://www.youtube-nocookie.com/embed/${current.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={`${name} — ${current.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => online && setPlaying(true)}
            aria-label={online ? `Play form video for ${name}` : "Video needs internet"}
            className="group absolute inset-0 h-full w-full"
          >
            {poster ? (
              <img
                src={poster}
                alt=""
                aria-hidden
                className="h-full w-full bg-white object-cover opacity-45"
                loading="lazy"
              />
            ) : (
              <span
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${color}26, ${color}0a)` }}
              />
            )}

            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-iron/45">
              {online ? (
                <>
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform group-active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#0a0e14" }}
                  >
                    <Play size={24} strokeWidth={2.5} fill="#0a0e14" />
                  </span>
                  <span className="px-4 text-center text-xs font-semibold text-ink">
                    Watch the form video
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface3 text-muted">
                    <WifiOff size={22} strokeWidth={2} />
                  </span>
                  <span className="px-4 text-center text-xs font-semibold text-muted">
                    Video needs internet — the rest of the app works offline.
                  </span>
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {/* ---- what is playing, and the dropdown ----------------------------- */}
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-xs text-muted">
          {current.kind === "short" ? current.title : `${video.title} · ${video.channel}`}
        </p>
        <ExternalLink href={watchUrl} className="shrink-0 text-xs font-semibold" style={{ color }}>
          YouTube
        </ExternalLink>
      </div>

      {clips.length > 1 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
            disabled={!online}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2 text-left text-xs font-semibold text-ink disabled:opacity-50"
          >
            <span className="truncate">
              {clips.length} clips — 1 full, {shorts.length} short
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2.5}
              aria-hidden
              className={`shrink-0 text-muted transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""}`}
            />
          </button>

          {pickerOpen && (
            <ul className="mt-1 overflow-hidden rounded-xl bg-surface2">
              {clips.map((clip, i) => (
                <li key={clip.videoId}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    aria-current={i === selected}
                    className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left first:border-t-0"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                      style={{
                        backgroundColor: i === selected ? color : "var(--color-surface3)",
                        color: i === selected ? "#0a0e14" : "var(--color-muted)",
                      }}
                    >
                      {clip.kind === "short" ? <Zap size={12} strokeWidth={2.5} /> : <Play size={12} strokeWidth={2.5} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">
                      {clip.title}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-muted">
                      {clip.kind === "short" ? "Short" : "Full"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---- the three shorts, as tappable tiles ---------------------------- */}
      {shorts.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
            Quick shorts
          </p>
          <div className="grid grid-cols-3 gap-2">
            {shorts.map((clip) => {
              const index = clips.indexOf(clip);
              const active = index === selected && playing;
              return (
                <button
                  key={clip.videoId}
                  type="button"
                  onClick={() => pick(index)}
                  disabled={!online}
                  title={clip.title}
                  className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-surface2 text-left transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={active ? { outline: `2px solid ${color}`, outlineOffset: -2 } : undefined}
                >
                  {/* YouTube's own thumbnail — needs signal, so the tile still
                      reads as a tile without it. */}
                  <img
                    src={`https://i.ytimg.com/vi/${clip.videoId}/hqdefault.jpg`}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-iron via-iron/20 to-transparent" />
                  <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-[10px] font-semibold leading-tight text-ink">
                    {clip.title}
                  </span>
                  {online && (
                    <span
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}e6`, color: "#0a0e14" }}
                    >
                      <Play size={10} strokeWidth={3} fill="#0a0e14" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
