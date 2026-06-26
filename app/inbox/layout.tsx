import type { Viewport } from "next";
import { INBOX_CRITICAL_CSS } from "./critical.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INBOX_CRITICAL_CSS }} />
      {children}
    </>
  );
}
