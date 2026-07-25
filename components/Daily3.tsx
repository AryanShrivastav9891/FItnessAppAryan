"use client";

import { Check, Pill, Droplets, Moon } from "lucide-react";
import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { todayKey } from "@/lib/date";
import { Card } from "@/components/ui";

const GLASSES = 8;

export default function Daily3() {
  const date = todayKey();
  const [creatine, setCreatine] = useLocalState<boolean>(keys.creatine(date), false);
  const [sleep, setSleep] = useLocalState<boolean>(keys.sleep(date), false);
  const [water, setWater] = useLocalState<number>(keys.water(date), 0);

  return (
    <Card className="divide-y divide-line">
      <ToggleRow
        icon={<Pill size={18} strokeWidth={2} />}
        label="Creatine 3–5g"
        sub="Rest days too — daily."
        checked={creatine}
        onToggle={() => setCreatine((v) => !v)}
        color="#b197fc"
      />

      <div className="flex items-center gap-3 p-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#4dabf71f", color: "#4dabf7" }}
        >
          <Droplets size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Water 3–4L</p>
          <div className="mt-1.5 flex items-center gap-1">
            {Array.from({ length: GLASSES }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1} glass water`}
                onClick={() => setWater((w) => (w === i + 1 ? i : i + 1))}
                className="h-6 flex-1 rounded-md transition-colors"
                style={{
                  backgroundColor: i < water ? "#4dabf7" : "var(--color-surface2)",
                  border: i < water ? "none" : "1px solid var(--color-line)",
                }}
              />
            ))}
          </div>
        </div>
        <span className="num shrink-0 text-xs text-muted">
          {water}/{GLASSES}
        </span>
      </div>

      <ToggleRow
        icon={<Moon size={18} strokeWidth={2} />}
        label="Sleep by 11:30"
        sub="7 hours minimum — muscle is built here."
        checked={sleep}
        onToggle={() => setSleep((v) => !v)}
        color="#4dabf7"
      />
    </Card>
  );
}

function ToggleRow({
  icon,
  label,
  sub,
  checked,
  onToggle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  checked: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="flex w-full items-center gap-3 p-4 text-left transition-transform active:scale-[0.99]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-semibold ${checked ? "text-muted line-through" : "text-ink"}`}>
          {label}
        </span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm"
        style={
          checked
            ? { background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "#0a0e14" }
            : { border: "2px solid var(--color-surface3)" }
        }
      >
        {checked && (
          <span className="animate-check-pop">
            <Check size={16} strokeWidth={3} aria-hidden />
          </span>
        )}
      </span>
    </button>
  );
}
