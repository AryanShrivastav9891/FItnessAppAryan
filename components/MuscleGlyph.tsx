// Consistent 2-letter muscle codes so the same muscle reads identically everywhere.

const MATCHERS: [RegExp, string][] = [
  [/upper chest|clavicular|mid chest|sternal|chest|pec/i, "CH"],
  [/lat/i, "LA"],
  [/rhomboid|mid-back|middle trap|mid trap/i, "MB"],
  [/lower back|erector|spinal/i, "LB"],
  [/quad|vastus|teardrop/i, "QU"],
  [/hamstring|hams/i, "HA"],
  [/glute/i, "GL"],
  [/side delt/i, "SD"],
  [/rear delt/i, "RD"],
  [/front delt/i, "FD"],
  [/delt|shoulder/i, "SH"],
  [/upper trap|trap/i, "TR"],
  [/tricep/i, "TX"],
  [/brachialis/i, "BR"],
  [/bicep|brachii/i, "BI"],
  [/forearm|brachioradialis|grip/i, "FA"],
  [/oblique/i, "OB"],
  [/abs|abdominis|core|transverse/i, "AB"],
  [/soleus|gastro|calf/i, "CA"],
  [/rotator|cuff/i, "RC"],
  [/hip flexor/i, "HF"],
  [/full body|stabiliz/i, "ST"],
];

export function muscleCode(name: string): string {
  for (const [re, code] of MATCHERS) if (re.test(name)) return code;
  return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "MU";
}

/** Concise label for chips — drops the parenthetical/dash detail. */
export function shortMuscle(name: string): string {
  return name.split(/\s*[(—]/)[0].trim() || name;
}

export function MuscleGlyph({
  name,
  color,
  size = 24,
  muted = false,
}: {
  name: string;
  color: string;
  size?: number;
  muted?: boolean;
}) {
  const code = muscleCode(name);
  return (
    <span
      aria-hidden
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        letterSpacing: "0.02em",
        backgroundColor: muted ? "var(--color-surface3)" : `${color}22`,
        color: muted ? "var(--color-muted)" : color,
      }}
    >
      {code}
    </span>
  );
}
