import manifest from "@/data/exerciseImages.json";

export interface ExerciseImageEntry {
  images: string[];
  match: string;
  instructions: string[];
}

const MANIFEST = manifest as Record<string, ExerciseImageEntry>;

/** Local start/end demo photos for an exercise/warmup/stretch id, or null. */
export function getImages(id: string): ExerciseImageEntry | null {
  return MANIFEST[id] ?? null;
}
