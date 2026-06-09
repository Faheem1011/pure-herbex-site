"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

export default function VoiceMemoField({ value, onChange, compact }: Props) {
  return (
    <div
      className={`rounded-lg border border-amber-500/25 bg-amber-500/5 ${
        compact ? "px-2.5 py-1.5 mb-2" : "px-3 py-2 mb-2"
      }`}
    >
      <label className="block text-[10px] font-semibold text-amber-400/90 mb-1 uppercase tracking-wide">
        Voice label — only you see this
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={compact ? 1 : 2}
        maxLength={200}
        placeholder='e.g. "Price & delivery reply", "Welcome script", "Follow-up day 3"'
        className="w-full resize-none bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none leading-relaxed"
      />
    </div>
  );
}
