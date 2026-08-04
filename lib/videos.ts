import manifest from "@/data/exerciseVideos.json";

export interface ExerciseVideo {
  /** The 11-character YouTube id, ready for /embed/<id>. */
  videoId: string;
  title: string;
  channel: string;
  /** The coach's original search terms, kept as a fallback link. */
  query: string;
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
