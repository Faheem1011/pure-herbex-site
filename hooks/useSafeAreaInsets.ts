"use client";

import { useEffect } from "react";
import { getAndroidBridge } from "@/hooks/useAndroidBridge";

/** Apply safe-area CSS vars (WebView often reports env(safe-area-inset-*) as 0 on Android). */
export function useSafeAreaInsets() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const android = getAndroidBridge();
    const topPx = android?.getStatusBarInsetPx?.() ?? 0;
    const bottomPx = android?.getNavigationBarInsetPx?.() ?? 0;

    const root = document.documentElement;
    if (topPx > 0) {
      root.style.setProperty("--android-safe-top", `${topPx}px`);
    }
    if (bottomPx > 0) {
      root.style.setProperty("--android-safe-bottom", `${bottomPx}px`);
    }

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.getAttribute("content")?.includes("viewport-fit=cover")) {
      const content = meta.getAttribute("content") || "";
      meta.setAttribute("content", `${content}, viewport-fit=cover`.replace(/^, /, ""));
    }
  }, []);
}
