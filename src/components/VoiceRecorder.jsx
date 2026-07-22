import { useEffect, useRef, useState } from "react";

import { startRecording, blobToDataURL, fmtClock } from "../lib/media";
import { TrashIcon, SendIcon } from "./icons";

const MAX_SECONDS = 120; // hard cap; size guard also applies

// Inline recording bar shown in place of the composer while recording a voice
// message. Opens the mic on mount, ticks a timer, and returns the encoded clip
// via onSend. Cancelling (or unmount) always releases the mic.
export default function VoiceRecorder({ maxBytes, onSend, onCancel, onError }) {
  const [seconds, setSeconds] = useState(0);
  const ctrlRef = useRef(null);
  const timerRef = useRef(null);
  const liveRef = useRef(false); // a recorder is currently open
  const finishingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = await startRecording({ video: false });
        if (cancelled) {
          ctrl.cancel();
          return;
        }
        ctrlRef.current = ctrl;
        liveRef.current = true;
        timerRef.current = setInterval(
          () => setSeconds((s) => (s + 1 >= MAX_SECONDS ? (stopAndSend(), s) : s + 1)),
          1000,
        );
      } catch {
        onError?.("Нет доступа к микрофону. Разрешите доступ в браузере.");
        onCancel?.();
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      if (ctrlRef.current && liveRef.current) ctrlRef.current.cancel();
      liveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAndSend = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    clearInterval(timerRef.current);
    const ctrl = ctrlRef.current;
    if (!ctrl || !liveRef.current) return onCancel?.();
    liveRef.current = false;
    const blob = await ctrl.stop();
    if (!blob || blob.size === 0) return onCancel?.();
    if (maxBytes && blob.size > maxBytes) {
      onError?.("Голосовое слишком длинное. Запишите короче.");
      return onCancel?.();
    }
    const data = await blobToDataURL(blob);
    onSend({
      kind: "voice",
      attachment: {
        type: blob.type || "audio/webm",
        data,
        size: blob.size,
        duration: seconds || 1,
      },
    });
  };

  const cancel = () => {
    clearInterval(timerRef.current);
    if (ctrlRef.current && liveRef.current) ctrlRef.current.cancel();
    liveRef.current = false;
    onCancel?.();
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 backdrop-blur">
      <button
        type="button"
        onClick={cancel}
        aria-label="Отменить запись"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#f87171] transition hover:bg-[var(--surface-hover)]"
      >
        <TrashIcon className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#ff5d6c]" />
        <span className="text-sm tabular-nums text-[var(--text)]">{fmtClock(seconds)}</span>
        <span className="flex flex-1 items-center gap-[3px] overflow-hidden" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] shrink-0 rounded-full bg-[var(--accent)]"
              style={{
                height: `${20 + ((i * 7) % 60)}%`,
                animation: "rec-bar 1s ease-in-out infinite",
                animationDelay: `${(i % 6) * 0.09}s`,
                opacity: 0.55,
              }}
            />
          ))}
        </span>
        <span className="hidden text-xs text-[var(--text-muted)] sm:inline">запись…</span>
      </div>

      <button
        type="button"
        onClick={stopAndSend}
        aria-label="Отправить голосовое"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110"
        style={{ background: "linear-gradient(120deg, #8b5cf6 0%, #c4b5fd 100%)" }}
      >
        <SendIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
