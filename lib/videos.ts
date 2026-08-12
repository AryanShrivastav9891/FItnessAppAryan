import manifest from "@/data/exerciseVideos.json";

/** A vertical <60s clip. No channel — YouTube's shorts results do not carry one. */
export interface ExerciseShort {
  /** The 11-character YouTube id, ready for /embed/<id>. */
  videoId: string;
  title: string;
}

export interface ExerciseVideo {
  /** The 11-character YouTube id, ready for /embed/<id>. */
  videoId: string;
  title: string;
  channel: string;
  /** The coach's original search terms, kept as a fallback link. */
  query: string;
  /** Up to 3 quick shorts for the same movement. Empty when none resolved. */
  shorts?: ExerciseShort[];
}

/** Every clip for an exercise as one list, the full-length one first. */
export function getClips(id: string): (ExerciseShort & { kind: "full" | "short" })[] {
  const video = getVideo(id);
  if (!video) return [];
  return [
    { videoId: video.videoId, title: video.title, kind: "full" as const },
    ...(video.shorts ?? []).map((s) => ({ ...s, kind: "short" as const })),
  ];
}

const MANIFEST = manifest as Record<string, ExerciseVideo>;

/**
 * The resolved form video for an exercise/warmup/stretch id, or null when the
 * search never resolved — callers fall back to the plain YouTube search link.
 * Populated by `npm run videos` (scripts/resolve-videos.mjs).
 */
export function getVideo(id: string): ExerciseVideo | null {
  return MANIFEST[id] ?? null;
}
