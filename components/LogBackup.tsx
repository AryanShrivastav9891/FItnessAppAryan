"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { exportLogs, importLogs, readLogs, setAllow125 } from "@/lib/logs";
import { useStorageTick } from "@/lib/storage";

/**
 * §3 — Export / Import JSON. There is no backend, so this file IS the backup:
 * a new phone, a cleared cache or a reinstall all come back from it.
 */
export default function LogBackup() {
  const { hydrated } = useStorageTick();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const store = hydrated ? readLogs() : null;

  const download = () => {
    try {
      const blob = new Blob([exportLogs()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coach-logs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({ ok: true, text: `Exported ${store?.sessions.length ?? 0} sessions.` });
    } catch {
      setMsg({ ok: false, text: "Could not create the file on this device." });
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = importLogs(await file.text());
    setMsg({ ok: result.ok, text: result.message });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Backup</SectionTitle>
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm leading-relaxed text-muted">
          Everything is stored on this phone only. Export after a good week —
          that file is the whole log.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={download}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-surface2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
          >
            <Download size={16} strokeWidth={2.5} /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-surface2 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
          >
            <Upload size={16} strokeWidth={2.5} /> Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import a Coach backup file"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />

        {msg && (
          <p
            role="status"
            className="text-xs font-semibold"
            style={{ color: msg.ok ? "#51cf66" : "#ff6b6b" }}
          >
            {msg.text}
          </p>
        )}

        <label className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
          <span className="text-muted">
            Gym has <span className="num text-ink">1.25 kg</span> plates
            <span className="block text-xs">Lets the bar go up 2.5 kg instead of 5.</span>
          </span>
          <input
            type="checkbox"
            checked={store?.settings.allow125 ?? false}
            onChange={(e) => setAllow125(e.target.checked)}
            className="h-6 w-6 shrink-0 accent-[#51cf66]"
          />
        </label>
      </Card>
    </section>
  );
}
