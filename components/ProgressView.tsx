"use client";

import { useState } from "react";
import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { todayKey, shortDate } from "@/lib/date";
import type { Measurement, Tracking } from "@/lib/types";
import { Card, SectionTitle } from "@/components/ui";
import LineChart from "@/components/LineChart";

function monthsBetween(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00Z`).getTime();
  const db = new Date(`${b}T12:00:00Z`).getTime();
  return Math.max(0, (db - da) / (86_400_000 * 30.44));
}

type Verdict = { tone: "good" | "warn" | "neutral"; text: string };

function recompVerdict(sorted: Measurement[]): Verdict {
  if (sorted.length < 2)
    return {
      tone: "neutral",
      text: "2+ entries daal (2 hafte ke gap pe), phir recomp ka sach batata hoon.",
    };
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const months = monthsBetween(first.date, last.date) || 0.5;
  const allowedGain = 0.5 * months + 0.3; // +0.5 kg/month + tolerance
  const weightDelta = last.weight - first.weight;
  const waistDelta = last.waist - first.waist;

  const waistOK = waistDelta <= 0.3;
  const weightOK = weightDelta <= allowedGain;

  if (waistOK && weightOK)
    return {
      tone: "good",
      text: "Perfect recomp chal raha hai ✅ — weight control mein, waist same ya girti hui. Yahi X-frame ka rasta hai.",
    };
  if (!waistOK)
    return {
      tone: "warn",
      text: "Waist badh rahi hai — surplus zyada hai. Coach: belly badhe toh roti/rice thoda kam.",
    };
  return {
    tone: "warn",
    text: "Weight tezi se chadh gaya (fat aa sakta hai) — surplus halka kar, protein wahi rakh.",
  };
}

export default function ProgressView({ tracking }: { tracking: Tracking }) {
  const [list, setList] = useLocalState<Measurement[]>(keys.measurements, []);
  const [date, setDate] = useState(() => todayKey());
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");

  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const verdict = recompVerdict(sorted);

  const add = () => {
    const w = parseFloat(weight);
    const t = parseFloat(waist);
    if (!date || !Number.isFinite(w) || !Number.isFinite(t)) return;
    const next = [
      ...list.filter((m) => m.date !== date),
      { date, weight: w, waist: t },
    ];
    setList(next);
    setWeight("");
    setWaist("");
  };

  const remove = (d: string) => setList((prev) => prev.filter((m) => m.date !== d));

  const guide: { label: string; text: string }[] = [
    { label: "Start", text: tracking.start },
    { label: "Har 2 hafte", text: tracking.biweekly },
    { label: "Perfect recomp", text: tracking.perfectRecomp },
    { label: "Adjust", text: tracking.adjust },
    { label: "Sunday report", text: tracking.sundayReport },
    { label: "Mindset", text: tracking.mindset },
  ];

  const verdictColor =
    verdict.tone === "good"
      ? "#4ade80"
      : verdict.tone === "warn"
        ? "#F2B84B"
        : "#8b96a3";

  return (
    <div className="flex flex-col gap-5">
      {/* verdict */}
      <Card
        className="p-4"
        accent={verdictColor}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Perfect recomp?
        </p>
        <p
          className="mt-1 text-sm font-semibold leading-snug"
          style={{ color: verdictColor }}
        >
          {verdict.text}
        </p>
      </Card>

      {/* charts */}
      <section className="grid grid-cols-1 gap-3">
        <Card className="p-4">
          <SectionTitle>Weight (kg)</SectionTitle>
          <div className="mt-2">
            <LineChart
              values={sorted.map((m) => m.weight)}
              color="#3B6FD6"
              unit="kg"
            />
          </div>
        </Card>
        <Card className="p-4">
          <SectionTitle>Waist (cm)</SectionTitle>
          <div className="mt-2">
            <LineChart
              values={sorted.map((m) => m.waist)}
              color="#3FA463"
              unit="cm"
            />
          </div>
        </Card>
      </section>

      {/* entry form */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Nayi entry (har 2 hafte)</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-line bg-surface2 px-3 py-2 text-ink outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[12px] text-muted">
              Weight (kg)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="66"
                className="rounded-lg border border-line bg-surface2 px-3 py-2.5 text-base text-ink outline-none tabnum"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-muted">
              Waist (cm)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="82"
                className="rounded-lg border border-line bg-surface2 px-3 py-2.5 text-base text-ink outline-none tabnum"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={add}
            className="min-h-[48px] rounded-2xl bg-ink text-sm font-bold text-iron active:opacity-90"
          >
            Entry save karo
          </button>
        </Card>
      </section>

      {/* history */}
      {sorted.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>History</SectionTitle>
          <Card className="divide-y divide-line">
            {[...sorted].reverse().map((m) => (
              <div
                key={m.date}
                className="flex items-center justify-between gap-3 p-3"
              >
                <span className="text-[12px] text-muted tabnum">
                  {shortDate(m.date)}
                </span>
                <span className="text-sm tabnum">
                  <b>{m.weight}</b> kg · <b>{m.waist}</b> cm
                </span>
                <button
                  type="button"
                  onClick={() => remove(m.date)}
                  aria-label={`Delete ${m.date}`}
                  className="text-[12px] font-medium text-muted active:text-ink"
                >
                  Delete
                </button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* photo reminder */}
      <Card className="p-4">
        <p className="text-[13px] leading-relaxed text-muted">
          📸 <span className="font-semibold text-ink">Photo:</span> Day 1 front +
          side, same lighting mein. Har mahine wahi angle — aaina jhooth bolta
          hai, camera nahi. (Uploads ki zaroorat nahi, bas phone gallery mein
          rakh.)
        </p>
      </Card>

      {/* tracking guide */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Tracking system — coach ka tareeka</SectionTitle>
        <Card className="divide-y divide-line">
          {guide.map((g) => (
            <div key={g.label} className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {g.label}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink">
                {g.text}
              </p>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
