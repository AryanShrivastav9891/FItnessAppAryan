import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a plain HTML/CSS/JS site into `out/` — no server needed at runtime.
  // This is what lets the service worker precache every route by name.
  output: "export",
};

export default nextConfig;
