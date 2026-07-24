import { useEffect, useRef, useState } from "react";

import { startRecording, blobToDataURL, fmtClock } from "../lib/media";
import { XIcon, VideoIcon, StopIcon, SendIcon } from "./icons";

const MAX_SECONDS = 60;

// Telegram-style round video message. Opens the camera into a circular live
// preview; record → stop → review → send. Always releases the camera on close.
export default function RoundVideoRecorder({ maxBytes, onSend, onClose, onError }) {
  const videoRef = useRef(null);
  const ctrlRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | recording | review
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null); // { url, attachment }

  // Warm up the camera for the live preview as soon as the modal opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: "user", width: 480, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      } catch {
        onError?.("Нет доступа к камере. Разрешите доступ в браузере.");
        onClose?.();
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      if (ctrlRef.current) ctrlRef.current.cancel();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (clip?.url) URL.revokeObjectURL(clip.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    try {
      // Reuse the warm preview stream by recording a fresh session on it.
      const ctrl = await startRecording({ video: true });
      ctrlRef.current = ctrl;
      // Swap the preview to the recording stream so the mirror stays live.
      if (videoRef.current) {
        videoRef.current.srcObject = ctrl.stream;
        videoRef.current.play().catch(() => {});
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = ctrl.stream;
      setPhase("recording");
      setSeconds(0);
      timerRef.current = setInterval(
        () => setSeconds((s) => (s + 1 >= MAX_SECONDS ? (stop(), s) : s + 1)),
        1000,
      );
    } catch {
      onError?.("Не удалось начать запись.");
    }
  };

  const stop = async () => {
    clearInterval(timerRef.current);
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrlRef.current = null;
    const blob = await ctrl.stop();
    streamRef.current = null;
    if (!blob || blob.size === 0) {
      onClose?.();
      return;
    }
    if (maxBytes && blob.size > maxBytes) {
      onError?.("Видео слишком большое. Запишите короче.");
      onClose?.();
      return;
    }
    const url = URL.createObjectURL(blob);
    const data = await blobToDataURL(blob);
    setClip({
      url,
      attachment: {
        type: blob.type || "video/webm",
        data,
        size: blob.size,
        duration: seconds || 1,
        round: true,
      },
    });
    setPhase("review");
    // Show the recorded clip in the preview element.
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const send = () => {
    if (!clip) return;
    onSend({ kind: "video", attachment: clip.attachment });
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" style={{ backdropFilter: "blur(4px)" }} onClick={onClose} aria-label="Закрыть" />

      <div className="so-pop relative flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-[var(--border)] p-6"
        style={{ background: "var(--panel-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <h3 className="text-base font-semibold text-[var(--text-strong)]">Видеосообщение</h3>

        {/* Circular live/recorded preview */}
        <div
          className="relative h-60 w-60 overflow-hidden rounded-full ring-4 ring-[var(--ring)]"
          style={{ boxShadow: "0 18px 50px -18px rgba(120,80,240,.55)" }}
        >
          <video
            ref={videoRef}
            playsInline
            className="h-full w-full object-cover"
            style={{ transform: phase === "review" ? "none" : "scaleX(-1)" }}
          />
          {phase === "recording" && (
            <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff5d6c]" />
              <span className="tabular-nums">{fmtClock(seconds)}</span>
            </div>
          )}
        </div>

        {/* Controls per phase */}
        {phase === "idle" && (
          <button
            onClick={start}
            className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
          >
            <VideoIcon className="h-5 w-5" />
            Начать запись
          </button>
        )}
        {phase === "recording" && (
          <button
            onClick={stop}
            className="flex h-16 w-16 items-center justify-center rounded-full text-white transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
            aria-label="Остановить"
          >
            <StopIcon className="h-6 w-6" />
          </button>
        )}
        {phase === "review" && (
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
            >
              Отмена
            </button>
            <button
              onClick={send}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
            >
              <SendIcon className="h-5 w-5" />
              Отправить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
