"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const stroke = (active: boolean) => (active ? "#e8eaed" : "#8e95a3");

const TABS: Tab[] = [
  {
    href: "/",
    label: "Aaj",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/week",
    label: "Hafta",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="4.5"
          width="18"
          height="16"
          rx="2"
          stroke={stroke(a)}
          strokeWidth="1.8"
        />
        <path
          d="M3 9h18M8 3v3M16 3v3"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/diet",
    label: "Khana",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 3v7a2 2 0 0 0 2 2v9M6 3v4m4-4v4M8 3v4M18 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 19V5m0 14h16M7 15l4-5 3 3 5-7"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/rules",
    label: "Rules",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 3h9l4 4v14a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0V3Z"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 9h6M9 13h6M9 17h4"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 bg-iron/95 shadow-[0_-4px_16px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[60px] flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-all active:scale-95"
                style={{ color: active ? "#e8eaed" : "#8e95a3" }}
              >
                {tab.icon(active)}
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
