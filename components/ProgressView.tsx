"use client";

import { useState } from "react";
import {
  Check,
  Eye,
  AlertTriangle,
  Dumbbell,
  CalendarCheck,
  Flame,
  Trophy,
  ArrowDown,
} from "lucide-react";
import { useLocalState } from "@/lib/storage";
import { keys } from "@/lib/keys";
import { shortDate, recentDayKeys, weekStripKeys, dayIdForKey } from "@/lib/date";
import { useTodayKey } from "@/lib/clock";
import type { Measurement, SessionsMap, Tracking } from "@/lib/types";
import { Card, SectionTitle } from "@/components/ui";
import LineChart from "@/components/LineChart";

function monthsBetween(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00Z`).getTime();
  const db = new Date(`${b}T12:00:00Z`).getTime();
  return Math.max(0, (db - da) / (86_400_000 * 30.44));
}

type VState = "track" | "watch" | "adjust";

function verdict(sorted: Measurement[]): { state: VState; text: string } | null {
  if (sorted.length < 2) return null;
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const months = monthsBetween(first.date, last.date) || 0.5;
  const allowedGain = 0.5 * months + 0.3;
  const weightDelta = last.weight - first.weight;
  const waistDelta = last.waist - first.waist;

  if (waistDelta > 0.3)
    return { state: "adjust", text: "Waist is going up — the surplus is too high. Coach: cut flatbread/rice a little." };
  if (weightDelta > allowedGain)
    return { state: "watch", text: "Weight went up fast (fat may be creeping in) — ease the surplus, keep protein the same." };
  return { state: "track", text: "Perfect recomp — weight in control, waist same or dropping. This is the road to the X-frame." };
}

function mondayKey(key: string): string {
  const wd = new Date(`${key}T12:00:00Z`).getUTCDay();
  const sinceMon = (wd + 6) % 7;
  const dt = new Date(new Date(`${key}T12:00:00Z`).getTime() - sinceMon * 86_400_000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function currentStreak(sessions: SessionsMap, today: string): number {
  const days = recentDayKeys(120);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const k = days[i];
    if (!dayIdForKey(k)) continue; // rest day
    if (sessions[k]) {
      streak++;
      continue;
    }
    if (k === today) continue; // today not done yet
    break;
  }
  return streak;
}

export default function ProgressView({ tracking }: { tracking: Tracking }) {
  const [list, setList] = useLocalState<Measurement[]>(keys.measurements, []);
  const [sessions] = useLocalState<SessionsMap>(keys.sessions, {});
  // The date field defaults to today (device clock, so it is empty until
  // hydration) and sticks to whatever the user picks instead.
  const today = useTodayKey();
  const [pickedDate, setDate] = useState<string | null>(null);
  const date = pickedDate ?? today ?? "";
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");

  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const v = verdict(sorted);

  // stat tiles
  const weekKeys = weekStripKeys();
  const thisWeekVol = weekKeys.reduce((n, k) => n + (sessions[k]?.volumeKg ?? 0), 0);
  const sessionsDone = weekKeys.filter((k) => sessions[k]).length;
  const planned = weekKeys.filter((k) => dayIdForKey(k)).length;
  const streak = currentStreak(sessions, today ?? "");
  const weekVols: Record<string, number> = {};
  for (const [k, s] of Object.entries(sessions)) {
    const mk = mondayKey(k);
    weekVols[mk] = (weekVols[mk] ?? 0) + (s.volumeKg ?? 0);
  }
  const bestWeekVol = Object.values(weekVols).reduce((m, x) => Math.max(m, x), 0);

  const add = () => {
    const w = parseFloat(weight);
    const t = parseFloat(waist);
    if (!date || !Number.isFinite(w) || !Number.isFinite(t)) return;
    setList([...list.filter((m) => m.date !== date), { date, weight: w, waist: t }]);
    setWeight("");
    setWaist("");
  };
  const remove = (d: string) => setList((prev) => prev.filter((m) => m.date !== d));

  const guide = [
    { label: "Start", text: tracking.start },
    { label: "Every 2 weeks", text: tracking.biweekly },
    { label: "Perfect recomp", text: tracking.perfectRecomp },
    { label: "Adjust", text: tracking.adjust },
    { label: "Sunday report", text: tracking.sundayReport },
    { label: "Mindset", text: tracking.mindset },
  ];

  return (
    <div className="flex flex-col gap-6">
      {v && <VerdictCard state={v.state} text={v.text} />}

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={<Dumbbell size={16} />} value={`${Math.round(thisWeekVol).toLocaleString("en-IN")}`} unit="kg" label="This week volume" color="#4dabf7" />
        <StatTile icon={<CalendarCheck size={16} />} value={`${sessionsDone}/${planned}`} unit="" label="Sessions" color="#51cf66" />
        <StatTile icon={<Flame size={16} />} value={`${streak}`} unit="" label="Streak (days)" color="#ff6b6b" />
        <StatTile icon={<Trophy size={16} />} value={`${Math.round(bestWeekVol).toLocaleString("en-IN")}`} unit="kg" label="Best week" color="#ffd43b" />
      </div>

      {/* charts or empty state */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-3">
          <Card className="p-4">
            <SectionTitle>Weight (kg)</SectionTitle>
            <div className="mt-2">
              <LineChart values={sorted.map((m) => m.weight)} color="#4dabf7" unit="kg" baseline={sorted[0].weight} />
            </div>
          </Card>
          <Card className="p-4">
            <SectionTitle>Waist (cm)</SectionTitle>
            <div className="mt-2">
              <LineChart values={sorted.map((m) => m.waist)} color="#51cf66" unit="cm" baseline={sorted[0].waist} />
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState />
      )}

      {/* entry form */}
      <section className="flex flex-col gap-3">
        <SectionTitle>New entry (every 2 weeks)</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="num rounded-xl bg-surface2 px-3 py-2.5 text-base text-ink outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Weight (kg)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="66"
                className="num rounded-xl bg-surface2 px-3 py-3 text-base text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Waist (cm)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="82"
                className="num rounded-xl bg-surface2 px-3 py-3 text-base text-ink outline-none"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={add}
            className="min-h-[52px] rounded-2xl bg-ink text-sm font-bold text-iron transition-transform active:scale-[0.98]"
          >
            Save entry
          </button>
        </Card>
      </section>

      {sorted.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>History</SectionTitle>
          <Card className="divide-y divide-line">
            {[...sorted].reverse().map((m) => (
              <div key={m.date} className="flex items-center justify-between gap-3 p-3.5">
                <span className="num text-xs text-muted">{shortDate(m.date)}</span>
                <span className="num text-sm">
                  <b>{m.weight}</b> kg · <b>{m.waist}</b> cm
                </span>
                <button
                  type="button"
                  onClick={() => remove(m.date)}
                  aria-label={`Delete ${m.date}`}
                  className="text-xs font-medium text-muted active:text-ink"
                >
                  Delete
                </button>
              </div>
            ))}
          </Card>
        </section>
      )}

      <Card className="p-4">
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">Photo:</span> Day 1 front + side,
          in the same lighting. Same angle every month — the mirror lies, the camera
          doesn&apos;t.
        </p>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionTitle>Tracking system — the coach&apos;s way</SectionTitle>
        <Card className="divide-y divide-line">
          {guide.map((g) => (
            <div key={g.label} className="p-3.5">
              <p className="t-cap">{g.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{g.text}</p>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function VerdictCard({ state, text }: { state: VState; text: string }) {
  const cfg = {
    track: { color: "#51cf66", label: "On Track", Icon: Check },
    watch: { color: "#ffd43b", label: "Watch", Icon: Eye },
    adjust: { color: "#ff6b6b", label: "Adjust", Icon: AlertTriangle },
  }[state];
  return (
    <Card className="flex items-start gap-3 p-4" accent={cfg.color}>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${cfg.color}1f`, color: cfg.color }}
      >
        <cfg.Icon size={20} strokeWidth={2.5} />
      </span>
      <div>
        <p className="t-cap" style={{ color: cfg.color }}>
          Recomp · {cfg.label}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{text}</p>
      </div>
    </Card>
  );
}

function StatTile({
  icon,
  value,
  unit,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-3xl bg-surface p-4 shadow-md"
      style={{ background: `linear-gradient(135deg, ${color}14, transparent 65%)`, backgroundColor: "var(--color-surface)" }}
    >
      <span style={{ color }}>{icon}</span>
      <p className="num mt-2 text-2xl font-bold leading-none">
        {value}
        {unit && <span className="text-base text-muted"> {unit}</span>}
      </p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-3 p-6 text-center">
      <svg viewBox="0 0 120 48" width="120" height="48" aria-hidden>
        <g fill="#252a33">
          <rect x="34" y="20" width="52" height="8" rx="4" />
          <rect x="24" y="12" width="8" height="24" rx="3" />
          <rect x="14" y="17" width="6" height="14" rx="3" />
          <rect x="88" y="12" width="8" height="24" rx="3" />
          <rect x="100" y="17" width="6" height="14" rx="3" />
        </g>
      </svg>
      <p className="text-sm leading-relaxed text-muted">
        No entries yet. Add your first entry on{" "}
        <span className="text-ink">Sunday</span> — coach&apos;s rule: weight + waist
        every 2 weeks.
      </p>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink">
        Fill the form below <ArrowDown size={14} strokeWidth={2.5} />
      </span>
    </Card>
  );
}
