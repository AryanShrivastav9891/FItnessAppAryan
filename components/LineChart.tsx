// Dependency-free sparkline: line + soft area fill + optional dashed baseline.
// Renders oldest → newest, left → right.

export default function LineChart({
  values,
  color,
  unit,
  baseline,
  secondary,
  emptyLabel = "No entries yet",
}: {
  values: number[];
  color: string;
  unit: string;
  baseline?: number;
  /** Optional dashed companion series drawn on the same scale (e.g. est. 1RM). */
  secondary?: { values: number[]; label: string };
  emptyLabel?: string;
}) {
  const W = 300;
  const H = 108;
  const pad = 12;
  const gid = `area-${unit.replace(/\W/g, "")}-${color.replace(/\W/g, "")}`;
  const sec = secondary?.values.length === values.length ? secondary : undefined;

  if (values.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }

  const all = [...values, ...(sec ? sec.values : []), ...(baseline != null ? [baseline] : [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const n = values.length;

  const x = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1));
  const y = (v: number) => H - pad - ((v - min) / span) * (H - 2 * pad);

  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area =
    n > 1
      ? `${pad},${H - pad} ${line} ${W - pad},${H - pad}`
      : "";

  const first = values[0];
  const last = values[n - 1];
  const delta = Math.round((last - first) * 10) / 10;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ height: "auto" }} role="img" aria-label={`${unit} trend`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {baseline != null && (
          <line
            x1={pad}
            y1={y(baseline)}
            x2={W - pad}
            y2={y(baseline)}
            stroke="#9aa3b2"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}

        {n > 1 && <polygon points={area} fill={`url(#${gid})`} />}
        {n > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {sec && n > 1 && (
          <polyline
            points={sec.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            opacity="0.55"
          />
        )}
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color} />
        ))}
      </svg>
      {sec && (
        <p className="num mt-1 text-[11px] text-muted">
          <span aria-hidden>- - -</span> {sec.label}: {sec.values[sec.values.length - 1]} {unit}
        </p>
      )}
      <div className="num mt-1 flex justify-between text-xs text-muted">
        <span>start {first} {unit}</span>
        <span style={{ color: delta === 0 ? undefined : color }}>
          {delta > 0 ? "+" : ""}{delta} {unit}
        </span>
        <span>now {last} {unit}</span>
      </div>
    </div>
  );
}
