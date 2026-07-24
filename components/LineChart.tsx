// Dependency-free sparkline: line + soft area fill + optional dashed baseline.
// Renders oldest → newest, left → right.

export default function LineChart({
  values,
  color,
  unit,
  baseline,
}: {
  values: number[];
  color: string;
  unit: string;
  baseline?: number;
}) {
  const W = 300;
  const H = 108;
  const pad = 12;
  const gid = `area-${unit.replace(/\W/g, "")}-${color.replace(/\W/g, "")}`;

  if (values.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted">
        Koi entry nahi
      </div>
    );
  }

  const all = baseline != null ? [...values, baseline] : values;
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
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color} />
        ))}
      </svg>
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
