"use client";

type Props = {
  note?: string;
  editable?: boolean;
  onSave?: (note: string) => void;
};

export default function VoiceAgentNote({ note, editable, onSave }: Props) {
  if (!note && !editable) return null;

  if (!note && editable) {
    return (
      <button
        type="button"
        onClick={() => {
          const next = window.prompt("Voice label (only you see this):", "")?.trim();
          if (next !== undefined && next !== "" && onSave) onSave(next);
        }}
        className="mb-1.5 text-[10px] text-amber-400/80 hover:text-amber-300 underline-offset-2 hover:underline"
      >
        + Add voice label
      </button>
    );
  }

  return (
    <div className="mb-1.5 px-2 py-1 rounded-md bg-black/25 border border-amber-500/20">
      <p className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wide mb-0.5">
        Your label
      </p>
      {editable ? (
        <button
          type="button"
          onClick={() => {
            const next = window.prompt("Voice label (only you see this):", note || "")?.trim();
            if (next !== undefined && onSave) onSave(next);
          }}
          className="text-left w-full text-xs text-[#e9edef] leading-snug hover:text-amber-100"
          title="Tap to edit label"
        >
          {note}
        </button>
      ) : (
        <p className="text-xs text-[#e9edef] leading-snug">{note}</p>
      )}
    </div>
  );
}
