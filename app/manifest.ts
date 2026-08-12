import type { MetadataRoute } from "next";

// manifest.ts compiles to a route handler, and `output: "export"` refuses to
// build a route handler it cannot prove is static. Without this the build fails
// outright with "export const dynamic ... not configured on route".
export const dynamic = "force-static";

/**
 * The web app manifest, emitted to /manifest.webmanifest during the export.
 *
 * Kept as a Next metadata route rather than a hand-written file in /public so
 * the theme and background colours stay in one place with app/layout.tsx and
 * cannot drift apart.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coach — 6-Month Mission",
    short_name: "Coach",
    description:
      "Personal 6-month aesthetic-body training plan: warm-up, lift, stretch, diet and the coach's rules.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e14",
    theme_color: "#0a0e14",
    icons: [
      // `any` and `maskable` are separate entries on purpose. Declaring one icon
      // as both lets Android apply the mask to artwork that was not drawn for
      // it, which crops the barbell plates off the edges.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
