import Link from "next/link";

/** Flat card. `accent` shows only as a 3px left bar — the app-wide accent rule. */
export function Card({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-line bg-surface shadow-sm ${className}`}
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`t-cap ${className}`}>{children}</h2>;
}

export function PageTitle({
  kicker,
  title,
  accent,
  action,
}: {
  kicker?: string;
  title: string;
  accent?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 pt-1">
      <div>
        {kicker && (
          <p className="t-cap" style={accent ? { color: accent } : undefined}>
            {kicker}
          </p>
        )}
        <h1 className="t-display mt-1.5">{title}</h1>
      </div>
      {action}
    </header>
  );
}

/** External link that always opens in a new tab (video / MuscleWiki). */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function TileLink({
  href,
  label,
  sub,
  icon,
  accent = "#9aa3b2",
}: {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[92px] flex-col justify-between rounded-3xl border border-line bg-surface p-4 shadow-sm transition-transform active:scale-[0.98]"
    >
      <span style={{ color: accent }}>{icon}</span>
      <span>
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </Link>
  );
}
