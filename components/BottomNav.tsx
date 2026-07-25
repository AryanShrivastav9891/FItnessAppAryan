"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  UtensilsCrossed,
  LineChart,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { dayIdForToday } from "@/lib/date";
import { dayColor } from "@/lib/plan";

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/week", label: "Week", Icon: CalendarDays },
  { href: "/diet", label: "Food", Icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", Icon: LineChart },
  { href: "/rules", label: "Rules", Icon: ScrollText },
];

export default function BottomNav() {
  const pathname = usePathname();
  const todayId = dayIdForToday();
  const accent = todayId ? dayColor(todayId) : "#4dabf7";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-iron/85 backdrop-blur-xl"
    >
      <ul
        className="mx-auto flex w-full max-w-md items-stretch justify-around px-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[60px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors"
                style={{ color: active ? "#e8eaed" : "#9aa3b2" }}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden />
                <span>{label}</span>
                <span
                  className="h-1 w-1 rounded-full transition-colors"
                  style={{ backgroundColor: active ? accent : "transparent" }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
