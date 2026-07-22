import { useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { fileToAvatarDataURL } from "../lib/image";
import { XIcon, CameraIcon, VideoIcon, SendPlaneIcon } from "./icons";

const BACKGROUNDS = [
  "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
  "linear-gradient(135deg, #f472b6 0%, #a855f7 100%)",
  "linear-gradient(135deg, #34d399 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
];

// ~700KB of raw media becomes ~950KB of base64 — the socket frame cap.
const MAX_VIDEO_BYTES = 700 * 1024;

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });

// Telegram-story-style post creator: full-bleed canvas, caption over a
// gradient background, or a photo/video with a caption. Publishing broadcasts
// the post to every contact via createPost.
export default function PostComposer({ open, onClose }) {
  const { createPost } = useWebSocket();
  const [text, setText] = useState("");
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  if (!open) return null;

  const hasMedia = Boolean(image || video);

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImage(await fileToAvatarDataURL(file, 720));
      setVideo(null);
      setError(null);
    } catch {
      setError("Не удалось прочитать фото");
    }
  };

  const pickVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Выберите видеофайл");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`Видео до ${Math.round(MAX_VIDEO_BYTES / 1024)} КБ — запишите короче`);
      return;
    }
    try {
      setVideo(await readAsDataURL(file));
      setImage(null);
      setError(null);
    } catch {
      setError("Не удалось прочитать видео");
    }
  };

  const clearMedia = () => {
    setImage(null);
    setVideo(null);
  };

  const publish = async () => {
    if (busy || (!text.trim() && !hasMedia)) return;
    setBusy(true);
    const res = await createPost({
      text: text.trim(),
      image,
      video,
      bg: hasMedia ? null : bg,
    });
    setBusy(false);
    if (res?.ok) {
      setText("");
      clearMedia();
      onClose();
    } else {
      setError(res?.error || "Не удалось опубликовать");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="so-pop relative flex h-[72vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Canvas */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden transition-all duration-300"
          style={hasMedia ? { background: "#000" } : { background: bg }}
        >
          {image && (
            <img src={image} alt="" className="fade-in absolute inset-0 h-full w-full object-cover" />
          )}
          {video && (
            <video
              src={video}
              className="fade-in absolute inset-0 h-full w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder={hasMedia ? "Подпись…" : "Что нового?"}
            className={
              hasMedia
                ? "absolute inset-x-0 bottom-3 z-10 w-full resize-none bg-transparent px-5 text-center text-base font-semibold text-white outline-none placeholder:text-white/60"
                : "relative z-10 w-full resize-none bg-transparent px-6 text-center text-2xl font-bold text-white outline-none placeholder:text-white/60"
            }
            rows={hasMedia ? 2 : 5}
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}
          />
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-2 text-white transition-all duration-200 hover:bg-black/60 active:scale-90"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 bg-[var(--surface-3)] p-3" style={{ background: "var(--panel-bg)" }}>
          <button
            onClick={() => photoRef.current?.click()}
            aria-label="Фото"
            title="Фото"
            className="rounded-full bg-[var(--surface-2)] p-2.5 text-[var(--text)] transition-all duration-200 hover:scale-110 hover:brightness-110 active:scale-90"
          >
            <CameraIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => videoRef.current?.click()}
            aria-label="Видео"
            title="Видео (до 700 КБ)"
            className="rounded-full bg-[var(--surface-2)] p-2.5 text-[var(--text)] transition-all duration-200 hover:scale-110 hover:brightness-110 active:scale-90"
          >
            <VideoIcon className="h-5 w-5" />
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={pickVideo} />
          {!hasMedia ? (
            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto px-1">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBg(b)}
                  aria-label="Фон"
                  className={`h-7 w-7 shrink-0 rounded-full transition-all duration-200 hover:scale-110 ${b === bg ? "scale-110 ring-2 ring-white" : ""}`}
                  style={{ background: b }}
                />
              ))}
            </div>
          ) : (
            <button
              onClick={clearMedia}
              className="flex-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              Убрать медиа
            </button>
          )}
          <button
            onClick={publish}
            disabled={busy || (!text.trim() && !hasMedia)}
            aria-label="Опубликовать"
            title="Опубликовать"
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(120deg, #8b5cf6 0%, #a78bfa 100%)" }}
          >
            {busy ? <span className="loading loading-spinner loading-xs" /> : <SendPlaneIcon className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p className="fade-in px-3 pb-2 text-xs text-rose-400" style={{ background: "var(--panel-bg)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
