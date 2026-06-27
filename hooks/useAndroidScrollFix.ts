"use client";

import { useEffect } from "react";

/** Android WebView cannot scroll nested overflow-y divs unless flex children use height:0 trick. */
export function fixAndroidInboxScroll(): void {
  if (typeof window === "undefined") return;
  const isAndroid =
    !!(window as Window & { Android?: unknown }).Android ||
    /PureHerbexInbox/i.test(navigator.userAgent);
  if (!isAndroid) return;

  document.querySelectorAll<HTMLElement>(".inbox-list-scroll, .inbox-chat-wallpaper").forEach((el) => {
    el.style.overflowY = "scroll";
    el.style.webkitOverflowScrolling = "touch";
    el.style.touchAction = "auto";
    el.style.overscrollBehavior = "auto";
  });
}

export function useAndroidScrollFix(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      fixAndroidInboxScroll();
      requestAnimationFrame(fixAndroidInboxScroll);
    };

    run();
    window.addEventListener("resize", run);
    window.addEventListener("orientationchange", run);
    const t = window.setTimeout(run, 300);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", run);
      window.removeEventListener("orientationchange", run);
    };
  }, [enabled]);
}
