// Native <details> disclosure — accessible, keyboard-friendly, zero client JS.
import { ChevronDown } from "lucide-react";

const TONE_COLOR: Record<string, string | undefined> = {
  default: undefined,
  warn: "#ffd43b",
  danger: "#ff6b6b",
  form: "#51cf66",
};

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  accent,
  tone = "default",
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
  tone?: "default" | "warn" | "danger" | "form";
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-semibold marker:hidden transition-colors [&::-webkit-details-marker]:hidden"
        style={{ color: TONE_COLOR[tone] }}
      >
        <span>{summary}</span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div
        className="pb-3 text-sm leading-relaxed text-muted"
        style={
          accent
            ? { borderLeft: `3px solid ${accent}`, paddingLeft: 12 }
            : undefined
        }
      >
        {children}
      </div>
    </details>
  );
}
