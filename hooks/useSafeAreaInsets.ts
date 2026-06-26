"use client";

import { useEffect } from "react";
import { getAndroidBridge } from "@/hooks/useAndroidBridge";

/** Ensure viewport-fit for iOS PWA. Android WebView uses native decor-fits (no CSS inset vars). */
export function useSafeAreaInsets() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (getAndroidBridge()) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.getAttribute("content")?.includes("viewport-fit=cover")) {
      const content = meta.getAttribute("content") || "";
      meta.setAttribute("content", `${content}, viewport-fit=cover`.replace(/^, /, ""));
    }
  }, []);
}
