import { MuscleGlyph, shortMuscle } from "./MuscleGlyph";

/** Flat chip — tinted for primary (day color), quiet surface for secondary. */
export function Chip({
  label,
  color,
  filled = false,
}: {
  label: string;
  color?: string;
  filled?: boolean;
}) {
  if (filled && color) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface2 px-2.5 py-1 text-xs font-medium text-muted">
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
    <div className="flex flex-wrap items-center gap-1.5">
      {primary.map((m) => (
        <span
          key={`p-${m}`}
          title={m}
          className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold"
          style={{ backgroundColor: `${color ?? "#8e95a3"}1f`, color: color ?? "#e8eaed" }}
        >
          <MuscleGlyph name={m} color={color ?? "#8e95a3"} size={18} />
          {shortMuscle(m)}
        </span>
      ))}
      {secondary.map((m) => (
        <Chip key={`s-${m}`} label={shortMuscle(m)} />
      ))}
    </div>
  );
}

/** A compact row of just the muscle glyphs — used on dense cards (day cards). */
export function MuscleGlyphRow({
  primary,
  color,
  max = 6,
}: {
  primary: string[];
  color: string;
  max?: number;
}) {
  const shown = primary.slice(0, max);
  const extra = primary.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((m) => (
        <MuscleGlyph key={m} name={m} color={color} size={26} />
      ))}
      {extra > 0 && (
        <span className="num text-xs text-muted">+{extra}</span>
      )}
    </div>
  );
}
