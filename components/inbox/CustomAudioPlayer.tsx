"use client";

import { useRef, useState } from "react";

export default function CustomAudioPlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const t = parseFloat(e.target.value);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s) || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-2 py-2 px-2.5 rounded-lg w-full max-w-[min(100%,260px)] min-w-[200px] ${
        isMe ? "bg-black/15" : "bg-black/20"
      }`}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 ${
          isMe
            ? "bg-[#0b141a]/80 text-[#00a884] hover:bg-[#0b141a]"
            : "bg-[#00a884] text-[#0b141a] hover:bg-[#06cf9c]"
        }`}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-end gap-[2px] h-5 mb-1">
          {[4, 7, 5, 9, 6, 8, 4, 7, 5, 8, 6, 9, 5, 7, 4].map((h, i) => (
            <span
              key={i}
              className={`w-[2px] rounded-full ${isMe ? "bg-[#53bdeb]/70" : "bg-[#00a884]/80"} ${
                isPlaying ? "animate-pulse" : ""
              }`}
              style={{ height: `${h}px`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="relative h-1 rounded-full overflow-hidden bg-white/10">
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${isMe ? "bg-[#53bdeb]" : "bg-[#00a884]"}`}
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek audio"
          />
        </div>
        <div className="flex justify-between mt-0.5 text-[10px] font-medium text-[#8696a0]">
          <span>{fmt(currentTime)}</span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
