import type { Metadata, Viewport } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorker from "@/components/ServiceWorker";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coach — 6-Month Mission",
  description:
    "Personal 6-month aesthetic-body training plan: warm-up, lift, stretch, diet and the coach's rules — all in one place.",
  applicationName: "Coach",
  // The <link rel="manifest"> is emitted by app/manifest.ts (Next's metadata
  // file convention), so it is deliberately not repeated here.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    // iOS ignores SVG here and falls back to a screenshot of the page, so the
    // home-screen icon has to be a PNG.
    apple: { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "Coach",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh bg-iron text-ink antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <main className="flex-1 px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))]">
            {children}
          </main>
          <BottomNav />
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
