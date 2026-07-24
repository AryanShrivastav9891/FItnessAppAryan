import Link from "next/link";

export function Card({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  const bgGradient = accent
    ? `linear-gradient(135deg, ${accent}15 0%, transparent 60%)`
    : undefined;
  
  return (
    <div
      className={`rounded-3xl bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.5)] ${className}`}
      style={bgGradient ? { background: bgGradient, backgroundColor: 'var(--color-surface)' } : undefined}
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
  return (
    <h2
      className={`text-xs font-semibold uppercase tracking-wider text-muted ${className}`}
    >
      {children}
    </h2>
  );
}

export function PageTitle({
  kicker,
  title,
  accent,
}: {
  kicker?: string;
  title: string;
  accent?: string;
}) {
  return (
    <header className="pt-2">
      {kicker && (
        <p
          className="text-xs font-semibold uppercase tracking-wider text-muted"
          style={accent ? { color: accent } : undefined}
        >
          {kicker}
        </p>
      )}
      <h1 className="font-display text-5xl leading-tight">{title}</h1>
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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export function TileLink({
  href,
  label,
  sub,
  icon,
}: {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[88px] flex-col justify-between rounded-3xl bg-surface p-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] active:scale-[0.98]"
    >
      <span className="text-muted transition-colors group-hover:text-ink">{icon}</span>
      <span>
        <span className="block text-base font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </Link>
  );
}
