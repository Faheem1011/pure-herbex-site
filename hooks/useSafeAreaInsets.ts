"use client";

import { useEffect } from "react";
import { getAndroidBridge } from "@/hooks/useAndroidBridge";

function applyAndroidInsets(): boolean {
  const android = getAndroidBridge();
  if (!android?.getStatusBarInsetPx || !android?.getNavigationBarInsetPx) {
    return false;
  }

  const top = android.getStatusBarInsetPx() ?? 0;
  const bottom = android.getNavigationBarInsetPx() ?? 0;
  const root = document.documentElement;
  root.style.setProperty("--android-safe-top", `${top}px`);
  root.style.setProperty("--android-safe-bottom", `${bottom}px`);
  root.style.setProperty("--inbox-safe-top", `${top}px`);
  root.style.setProperty("--inbox-safe-bottom", `${bottom}px`);
  root.classList.add("inbox-android-native");
  return true;
}

/** iOS PWA: viewport-fit=cover. Android WebView v2: native bridge injects px insets. */
export function useSafeAreaInsets() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (applyAndroidInsets()) {
      const retry = window.setTimeout(applyAndroidInsets, 120);
      window.addEventListener("resize", applyAndroidInsets);
      return () => {
        window.clearTimeout(retry);
        window.removeEventListener("resize", applyAndroidInsets);
      };
    }

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.getAttribute("content")?.includes("viewport-fit=cover")) {
      const content = meta.getAttribute("content") || "";
      meta.setAttribute("content", `${content}, viewport-fit=cover`.replace(/^, /, ""));
    }
  }, []);
}
