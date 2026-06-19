"use client";

import { memo, useEffect, useState } from "react";

type Props = {
  onSearchChange: (query: string) => void;
  debounceMs?: number;
};

function InboxSearchBar({ onSearchChange, debounceMs = 180 }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => onSearchChange(value), debounceMs);
    return () => window.clearTimeout(id);
  }, [value, debounceMs, onSearchChange]);

  return (
    <input
      type="search"
      placeholder="Search name or number..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoComplete="off"
      enterKeyHint="search"
      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
    />
  );
}

export default memo(InboxSearchBar);
