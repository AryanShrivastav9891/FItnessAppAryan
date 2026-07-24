import { MuscleGlyph, shortMuscle } from "./MuscleGlyph";

/** Bento chip — soft gradient tint for primary, quiet surface for secondary. */
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
        className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${color}30, ${color}20)`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface2/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
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
  const c = color ?? "#9aa3b2";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {primary.map((m) => (
        <span
          key={`p-${m}`}
          title={m}
          className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${c}28, ${c}18)`,
            color: c,
            border: `1px solid ${c}38`,
          }}
        >
          <MuscleGlyph name={m} color={c} size={18} />
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
      {extra > 0 && <span className="num text-xs text-muted">+{extra}</span>}
    </div>
  );
}
