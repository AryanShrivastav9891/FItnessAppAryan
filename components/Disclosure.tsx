// Native <details> disclosure — accessible, keyboard-friendly, zero client JS.

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
  tone?: "default" | "warn";
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-base font-semibold marker:hidden transition-colors hover:text-ink [&::-webkit-details-marker]:hidden"
        style={tone === "warn" ? { color: "#ffd43b" } : undefined}
      >
        <span>{summary}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div
        className="pb-3 text-sm leading-relaxed text-muted"
        style={accent ? { 
          borderLeft: `3px solid ${accent}40`,
          background: `linear-gradient(to right, ${accent}08, transparent)`,
          paddingLeft: 12,
          borderRadius: '0 8px 8px 0'
        } : undefined}
      >
        {children}
      </div>
    </details>
  );
}
