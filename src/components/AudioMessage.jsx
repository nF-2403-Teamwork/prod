import { useEffect, useRef, useState } from "react";

import { fmtClock } from "../lib/media";
import { PlayIcon, PauseIcon } from "./icons";

// Deterministic pseudo-waveform so a given clip always draws the same bars
// (no real FFT — this is a lightweight visual, like Telegram's voice notes).
function bars(seed, n = 28) {
  const s = String(seed || "");
  let h = 2166136261;
  const out = [];
  for (let i = 0; i < n; i++) {
    h ^= s.charCodeAt(i % (s.length || 1)) + i * 17;
    h = Math.imul(h, 16777619);
    out.push(0.28 + (Math.abs(h) % 100) / 100 * 0.72); // 0.28..1.0
  }
  return out;
}

// Playback UI for a voice message. `mine` flips the palette so it reads on the
// gradient (sent) vs. glass (received) bubble.
export default function AudioMessage({ src, duration = 0, mine = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(duration);
  const wave = useRef(bars(src)).current;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    const onTime = () => {
      const d = a.duration && isFinite(a.duration) ? a.duration : duration || 0;
      setElapsed(a.currentTime);
      setPos(d ? Math.min(1, a.currentTime / d) : 0);
    };
    const onMeta = () => {
      if (a.duration && isFinite(a.duration)) setTotal(a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setPos(0);
      setElapsed(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [duration]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const d = a.duration && isFinite(a.duration) ? a.duration : total || 0;
    if (d) {
      a.currentTime = ratio * d;
      setPos(ratio);
    }
  };

  const fg = mine ? "#ffffff" : "var(--accent)";
  const dim = mine ? "rgba(255,255,255,.4)" : "var(--text-faint)";

  return (
    <div className="flex min-w-[168px] items-center gap-3 py-1 pl-1 pr-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Пауза" : "Воспроизвести"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:brightness-110"
        style={{
          background: mine ? "rgba(255,255,255,.22)" : "var(--surface-hover)",
          color: mine ? "#fff" : "var(--accent)",
        }}
      >
        {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="flex h-7 cursor-pointer items-center gap-[3px]"
          onClick={seek}
          role="slider"
          aria-label="Перемотка"
          aria-valuenow={Math.round(pos * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
        >
          {wave.map((h, i) => (
            <span
              key={i}
              className="w-[3px] shrink-0 rounded-full transition-colors"
              style={{
                height: `${Math.round(h * 100)}%`,
                background: i / wave.length <= pos ? fg : dim,
              }}
            />
          ))}
        </div>
        <div className="mt-0.5 text-[11px] tabular-nums" style={{ color: dim }}>
          {fmtClock(playing || elapsed ? elapsed : total || duration)}
        </div>
      </div>
    </div>
  );
}
