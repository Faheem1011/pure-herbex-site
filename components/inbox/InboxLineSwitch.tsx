"use client";

import type { InboxLine } from "@/lib/inbox-line";

type Props = {
  line: InboxLine;
  compact?: boolean;
};

export default function InboxLineSwitch({ line, compact = false }: Props) {
  const target = line === "us" ? "/inbox/" : "/inbox-us/";
  const switchLabel = line === "us" ? "PK Main" : "US +1";
  const shortLabel = line === "us" ? "PK" : "US";

  return (
    <button
      type="button"
      onClick={() => window.location.assign(target)}
      className="inbox-line-switch"
      title={`Switch to ${switchLabel} inbox`}
      aria-label={`Switch to ${switchLabel} inbox`}
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
      <span className="inbox-line-switch__label">{compact ? shortLabel : switchLabel}</span>
    </button>
  );
}
