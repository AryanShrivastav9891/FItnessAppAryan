"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Play, WifiOff, Search } from "lucide-react";
import { getVideo } from "@/lib/videos";
import { getImages } from "@/lib/images";
import { useOnline } from "@/lib/online";
import { ExternalLink } from "@/components/ui";

/**
 * The form video, playing inline on the workout page.
 *
 * Nothing loads from YouTube until the play button is tapped: until then this
 * is the exercise's own local photo, which works with no signal. That keeps a
 * session with 6 exercises from pulling in 6 YouTube players, and keeps the
 * page honest offline — where it says so rather than showing a dead frame.
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
  const online = useOnline();
  const [playing, setPlaying] = useState(false);

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
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

  return (
    <div className="mt-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface2 shadow-sm">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={`${name} — form video`}
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

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-xs text-muted">
          {video.title} · {video.channel}
        </p>
        <ExternalLink href={watchUrl} className="shrink-0 text-xs font-semibold" style={{ color }}>
          YouTube
        </ExternalLink>
      </div>
    </div>
  );
}
