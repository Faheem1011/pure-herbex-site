"use client";

import { useEffect, useState } from "react";
import { resolveStatusClientApiBase } from "@/lib/resolve-status-api-base";

type StatusItem = {
  id: string;
  type: "image" | "video";
  mediaId: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
};

export default function StatusPage() {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    const base = resolveStatusClientApiBase();
    setApiBase(base);

    fetch(`${base}/api/status/?public=1`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load status (${res.status})`);
        }
        return res.json();
      })
      .then((data) => setItems(data.items || []))
      .catch((err: Error) => {
        setError(err.message || "Could not load status updates");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const mediaUrl = (id: string) =>
    `${apiBase || resolveStatusClientApiBase()}/api/media/?id=${encodeURIComponent(id)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#8696a0] text-sm">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Pure Herbex Status</h1>
        <p className="text-rose-300 text-sm mb-4">{error}</p>
        <a href="https://pureherbex.com" className="text-[#00a884] hover:underline">
          Visit pureherbex.com
        </a>
      </div>
    );
  }

  const active = items[activeIndex];

  if (!active) {
    return (
      <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Pure Herbex Status</h1>
        <p className="text-[#8696a0]">No active updates right now. Check back later.</p>
        <a href="https://pureherbex.com" className="mt-6 text-[#00a884] hover:underline">
          Visit pureherbex.com
        </a>
      </div>
    );
  }

  const hoursLeft = Math.max(0, Math.round((active.expiresAt - Date.now()) / 3600000));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 flex items-center justify-between safe-top bg-[#111b21] border-b border-white/10">
        <div>
          <h1 className="font-bold">Pure Herbex</h1>
          <p className="text-xs text-[#8696a0]">
            {hoursLeft}h left · {new Date(active.createdAt).toLocaleString()}
          </p>
        </div>
        <a href="https://pureherbex.com" className="text-sm text-[#00a884] font-medium">
          Shop
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-[#0b141a]">
        {active.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(active.mediaId)}
            alt={active.caption || "Status"}
            className="max-h-[70vh] max-w-full rounded-2xl object-contain"
            onError={() => setError("Could not load status image. Try again later.")}
          />
        ) : (
          <video
            src={mediaUrl(active.mediaId)}
            controls
            playsInline
            autoPlay
            className="max-h-[70vh] max-w-full rounded-2xl"
            onError={() => setError("Could not load status video. Try again later.")}
          />
        )}
      </div>

      {active.caption && (
        <p className="px-4 pb-4 text-center text-sm text-[#e9edef] bg-[#111b21]">{active.caption}</p>
      )}

      {items.length > 1 && (
        <div className="flex justify-center gap-2 py-4 safe-bottom bg-[#111b21]">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                idx === activeIndex ? "bg-[#00a884]" : "bg-[#8696a0]"
              }`}
              aria-label={`Status ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
