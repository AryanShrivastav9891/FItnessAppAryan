// The app's signature element. A loaded barbell whose plates = completed sets.
// Newly filled plates mount fresh (distinct React key) so only they animate in.

const PLATE_W = 9;
const GAP = 3;
const CAP = 9;
const PAD = 8;
const H = 40;

export default function BarbellLoader({
  total,
  done,
  color = "#F2F4F6",
  className = "",
  animate = true,
}: {
  total: number;
  done: number;
  color?: string;
  className?: string;
  animate?: boolean;
}) {
  const count = Math.max(1, total);
  const filled = Math.min(Math.max(done, 0), count);
  const plateSpan = count * (PLATE_W + GAP) - GAP;
  const x0 = CAP + PAD;
  const width = x0 + plateSpan + PAD + CAP;
  const mid = H / 2;
  const complete = filled >= count;

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={`${filled} of ${count} sets loaded`}
    >
      {/* the bar / rod */}
      <rect
        x={CAP - 2}
        y={mid - 2}
        width={width - 2 * (CAP - 2)}
        height={4}
        rx={2}
        fill="rgba(255, 255, 255, 0.08)"
      />
      {/* sleeve collars */}
      <rect x={2} y={mid - 11} width={CAP} height={22} rx={3} fill="#252a33" />
      <rect
        x={width - CAP - 2}
        y={mid - 11}
        width={CAP}
        height={22}
        rx={3}
        fill="#252a33"
      />

      {Array.from({ length: count }).map((_, i) => {
        const x = x0 + i * (PLATE_W + GAP);
        const isFilled = i < filled;
        if (isFilled) {
          return (
            <g
              key={`f${i}`}
              className={animate ? "animate-bounce-in" : undefined}
              style={{ transformOrigin: `${x + PLATE_W / 2}px ${mid}px`, animationDelay: `${i * 50}ms` }}
            >
              <rect
                x={x}
                y={mid - 15}
                width={PLATE_W}
                height={30}
                rx={3}
                fill={color}
                opacity={0.95}
              />
              {/* metallic top-edge highlight */}
              <rect
                x={x + 1}
                y={mid - 14}
                width={PLATE_W - 2}
                height={1.4}
                rx={0.7}
                fill="#ffffff"
                opacity={0.35}
              />
            </g>
          );
        }
        return (
          <rect
            key={`e${i}`}
            x={x}
            y={mid - 12}
            width={PLATE_W}
            height={24}
            rx={3}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1.4}
          />
        );
      })}

      {complete && (
        <circle
          cx={width - CAP - 2}
          cy={6}
          r={4}
          fill="#4ade80"
          className={animate ? "animate-plate-in" : undefined}
        />
      )}
    </svg>
  );
}
