"use client";

import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { plan } from "@/lib/plan";
import { getImages } from "@/lib/images";
import type { StaticItem } from "@/lib/types";
import { Disclosure } from "@/components/Disclosure";
import CheckRow from "./CheckRow";

export default function StretchList({
  items,
  date,
  color,
}: {
  items: StaticItem[];
  date: string;
  color: string;
}) {
  const [checked, setChecked] = useLocalState<string[]>(keys.stretch(date), []);
  const toggle = (id: string) =>
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl bg-surface2 p-3 text-[13px] leading-snug text-muted">
        <span className="font-semibold text-ink">Step 3: </span>
        Static stretching AFTER the workout — hold each pose 20–30 sec, no bouncing.
      </p>

      <div className="rounded-2xl border border-line bg-surface px-4">
        {items.map((s) => (
          <CheckRow
            key={s.id}
            checked={checked.includes(s.id)}
            onToggle={() => toggle(s.id)}
            title={s.name}
            dose={s.dose}
            desc={s.target}
            video={s.video}
            color={color}
            photo={getImages(s.id)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface px-4">
        <Disclosure summary="Stretching golden rules">
          <ul className="mt-1 flex flex-col gap-2 pb-1">
            {plan.stretchingRules.map((r) => (
              <li key={r} className="flex gap-2 text-[13px] leading-snug text-ink">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>
    </div>
  );
}
