"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/status?public=1")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const active = items[activeIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
        Loading status...
      </div>
    );
  }

  if (!active) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Pure Herbex Status</h1>
        <p className="text-zinc-500">No active updates right now. Check back later.</p>
        <a href="/" className="mt-6 text-emerald-400 hover:underline">Visit pureherbex.com</a>
      </div>
    );
  }

  const hoursLeft = Math.max(0, Math.round((active.expiresAt - Date.now()) / 3600000));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 flex items-center justify-between safe-top">
        <div>
          <h1 className="font-bold">Pure Herbex</h1>
          <p className="text-xs text-zinc-400">{hoursLeft}h left · {new Date(active.createdAt).toLocaleString()}</p>
        </div>
        <a href="/" className="text-sm text-emerald-400">Shop</a>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {active.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media?id=${active.mediaId}`}
            alt={active.caption || "Status"}
            className="max-h-[70vh] max-w-full rounded-2xl object-contain"
          />
        ) : (
          <video
            src={`/api/media?id=${active.mediaId}`}
            controls
            autoPlay
            className="max-h-[70vh] max-w-full rounded-2xl"
          />
        )}
      </div>

      {active.caption && (
        <p className="px-4 pb-4 text-center text-sm text-zinc-300">{active.caption}</p>
      )}

      {items.length > 1 && (
        <div className="flex justify-center gap-2 pb-6 safe-bottom">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full ${idx === activeIndex ? "bg-emerald-400" : "bg-zinc-600"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
