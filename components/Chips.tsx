export function Chip({
  label,
  color,
  filled = false,
}: {
  label: string;
  color?: string;
  filled?: boolean;
}) {
  if (filled) {
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm"
        style={{
          background: color ? `linear-gradient(135deg, ${color}30, ${color}20)` : "#151921",
          color: color ?? "#e8eaed",
          border: `1px solid ${color ? `${color}40` : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface2/50 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
      {label}
    </span>
  );
}

export function MuscleChips({
  primary,
  secondary,
  color,
}: {
  primary: string[];
  secondary: string[];
  color?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {primary.map((m) => (
        <Chip key={`p-${m}`} label={m} color={color} filled />
      ))}
      {secondary.map((m) => (
        <Chip key={`s-${m}`} label={m} />
      ))}
    </div>
  );
}
