"use client";

import { useCallback, useEffect, useState } from "react";

type MetaLeadStats = {
  configured: boolean;
  enabled: boolean;
  qualified: number;
  unqualified: number;
  purchases: number;
  adLeads: number;
  errors: number;
  lastEventAt?: number;
  lastError?: string;
};

type Props = {
  apiPath: string;
  sessionToken: string;
};

export default function MetaLeadQualityCard({ apiPath, sessionToken }: Props) {
  const [stats, setStats] = useState<MetaLeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [apiPath, sessionToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;

  return (
    <div className="mb-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-bold text-sky-300">Facebook ad quality</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
            Auto-reports Confirm orders vs Spam/blocked leads to Meta so ads optimize for real buyers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="text-[10px] text-sky-400 hover:text-sky-300 shrink-0"
        >
          Refresh
        </button>
      </div>

      {!stats?.configured ? (
        <p className="text-[10px] text-amber-400/90">
          Add META_PIXEL_ID + META_CAPI_ACCESS_TOKEN in Vercel env to enable.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
            <div className="text-base font-bold text-emerald-400">{stats.qualified}</div>
            <div className="text-[9px] text-emerald-600">Qualified (Confirm)</div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-center">
            <div className="text-base font-bold text-emerald-300">{stats.purchases}</div>
            <div className="text-[9px] text-emerald-700">Delivered / Purchase</div>
          </div>
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-center">
            <div className="text-base font-bold text-rose-400">{stats.unqualified}</div>
            <div className="text-[9px] text-rose-600">Fake / Spam / Blocked</div>
          </div>
          <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-2 text-center">
            <div className="text-base font-bold text-zinc-300">{stats.adLeads}</div>
            <div className="text-[9px] text-zinc-500">From Facebook ads</div>
          </div>
        </div>
      )}

      {stats?.errors ? (
        <p className="text-[10px] text-rose-400/80 mt-2">
          {stats.errors} send error{stats.errors === 1 ? "" : "s"}
          {stats.lastError ? `: ${stats.lastError}` : ""}
        </p>
      ) : null}
    </div>
  );
}
