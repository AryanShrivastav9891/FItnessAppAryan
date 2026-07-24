"use client";

import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import type { WarmupItem } from "@/lib/types";
import CheckRow from "./CheckRow";

export default function WarmupList({
  items,
  date,
  color,
}: {
  items: WarmupItem[];
  date: string;
  color: string;
}) {
  const [checked, setChecked] = useLocalState<string[]>(keys.warmup(date), []);
  const toggle = (id: string) =>
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl bg-surface2 p-3 text-[13px] leading-snug text-muted">
        <span className="font-semibold text-ink">Step 1: </span>
        Pehle <span className="text-ink">5 min incline walk/cycle</span> (halki
        saans phoole), phir ye dynamic warm-up (~5 min). Pehli exercise ke 1–2
        halke ramp-up sets bhi.
      </p>

      <div className="rounded-2xl border border-line bg-surface px-4">
        {items.map((w) => (
          <CheckRow
            key={w.id}
            checked={checked.includes(w.id)}
            onToggle={() => toggle(w.id)}
            title={w.name}
            dose={w.dose}
            desc={w.why}
            video={w.video}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}
