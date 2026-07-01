"use client";

import { useCallback, useEffect, useState } from "react";

type SpamStats = {
  autoBlocked: number;
  manualBlocked: number;
  whatsappApiOk: number;
  whatsappApiFailed: number;
  lastBlockedAt?: number;
  lastBlockedName?: string;
};

export default function SpamProtectionCard({
  apiPath,
  sessionToken,
  onScanComplete,
}: {
  apiPath: string;
  sessionToken: string;
  onScanComplete?: () => void;
}) {
  const [stats, setStats] = useState<SpamStats | null>(null);
  const [scanning, setScanning] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats || null);
    } catch {
      /* ignore */
    }
  }, [apiPath, sessionToken]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const runScan = async (dryRun: boolean) => {
    setScanning(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Scan failed");
        return;
      }
      if (data.stats) setStats(data.stats);
      if (dryRun) {
        alert(
          `Found ${data.matched} spam-style names in ${data.scanned} contacts.\n\nExamples:\n${(data.samples || [])
            .slice(0, 8)
            .map((s: { name: string }) => `• ${s.name}`)
            .join("\n")}\n\nTap "Block all" to block them on WhatsApp.`
        );
      } else {
        alert(
          `Blocked ${data.blocked} contacts.\nWhatsApp API OK: ${data.whatsappOk}\nFailed (retry when they message): ${data.whatsappFailed}`
        );
        onScanComplete?.();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="mx-3 mb-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-rose-300">Spam shield</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
            Auto-blocks farm names (kk30641320, usaf69406…) on WhatsApp + inbox.
          </p>
          {stats ? (
            <p className="text-[10px] text-zinc-400 mt-1">
              Auto-blocked: {stats.autoBlocked} · WA API: {stats.whatsappApiOk} ok /{" "}
              {stats.whatsappApiFailed} retry
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          disabled={scanning}
          onClick={() => void runScan(true)}
          className="flex-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          Preview scan
        </button>
        <button
          type="button"
          disabled={scanning}
          onClick={() => void runScan(false)}
          className="flex-1 px-2 py-1.5 text-[10px] font-bold rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
        >
          {scanning ? "…" : "Block all"}
        </button>
      </div>
    </div>
  );
}
