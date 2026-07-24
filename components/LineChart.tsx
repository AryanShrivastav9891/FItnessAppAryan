// Tiny dependency-free line chart. Renders values left→right (oldest→newest).

export default function LineChart({
  values,
  color,
  unit,
}: {
  values: number[];
  color: string;
  unit: string;
}) {
  const W = 300;
  const H = 96;
  const pad = 10;

  if (values.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-[12px] text-muted">
        Koi entry nahi
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const n = values.length;

  const x = (i: number) =>
    n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - 2 * pad);

  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values[n - 1];
  const first = values[0];
  const delta = last - first;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ height: "auto" }}
        role="img"
        aria-label={`${unit} trend`}
      >
        {n > 1 && (
          <polyline
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted tabnum">
        <span>
          start {first} {unit}
        </span>
        <span style={{ color: delta === 0 ? undefined : color }}>
          {delta > 0 ? "+" : ""}
          {Math.round(delta * 10) / 10} {unit}
        </span>
        <span>
          now {last} {unit}
        </span>
      </div>
    </div>
  );
}
