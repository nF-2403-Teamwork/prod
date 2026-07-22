import { useState } from "react";
import { useSelector } from "react-redux";
import { XIcon, TrashIcon } from "./icons";

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("ru", { day: "numeric", month: "short" });
const fmtFull = (ts) =>
  new Date(ts).toLocaleString("ru", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

const EyeIcon = (p) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...p}
  >
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

const TEXT_BGS = [
  "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
  "linear-gradient(135deg, #f472b6 0%, #a855f7 100%)",
  "linear-gradient(135deg, #34d399 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
];
const bgFor = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return TEXT_BGS[h % TEXT_BGS.length];
};

// Telegram-style post grid: big square tiles, 3 per row, views + date pinned
// to the bottom of each tile. Clicking opens a lightbox with the full post.
// `viewsOf(post)` resolves the counter (author sees unique viewers, contacts
// see the broadcast total). `onOpen(post)` fires when a post is viewed.
export default function PostGrid({ posts, mine, viewsOf, onOpen, onDelete }) {
  const [active, setActive] = useState(null);

  if (!posts.length) return null;

  const open = (p) => {
    setActive(p);
    onOpen?.(p);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((p) => (
          <button
            key={p.id}
            onClick={() => open(p)}
            className="so-pop group relative aspect-square overflow-hidden rounded-lg text-left transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            style={p.image ? undefined : { background: bgFor(p.id) }}
          >
            {p.video ? (
              <>
                <video
                  src={p.video}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 pl-0.5 text-white transition-transform duration-200 group-hover:scale-110">
                    ▶
                  </span>
                </span>
              </>
            ) : p.image ? (
              <img
                src={p.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span
                className="absolute inset-0 flex items-center justify-center p-2 text-center text-[11px] font-medium leading-snug text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:5] overflow-hidden"
                style={p.bg ? { background: p.bg } : undefined}
              >
                {p.text}
              </span>
            )}
            {/* Bottom info bar: views left, date right (Telegram style) */}
            <span
              className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1.5 pb-1 pt-4 text-[10px] font-medium text-white"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}
            >
              <span className="flex items-center gap-0.5">
                <EyeIcon />
                {viewsOf?.(p) ?? 0}
              </span>
              <span>{fmtDate(p.ts)}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div
            className="fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />
          <div
            className="so-pop relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)]"
            style={{ background: "var(--panel-bg)", backdropFilter: "blur(24px)" }}
          >
            {active.video ? (
              <video
                src={active.video}
                className="max-h-[50vh] w-full bg-black object-contain"
                controls
                autoPlay
                loop
                playsInline
              />
            ) : active.image ? (
              <img src={active.image} alt="" className="max-h-[45vh] w-full object-cover" />
            ) : active.bg ? (
              <div
                className="flex min-h-[30vh] items-center justify-center p-6"
                style={{ background: active.bg }}
              >
                <p
                  className="whitespace-pre-wrap text-center text-xl font-bold text-white"
                  style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
                >
                  {active.text}
                </p>
              </div>
            ) : null}
            <div className="so-scroll flex-1 overflow-y-auto p-4">
              {active.text && !active.bg && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                  {active.text}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <EyeIcon />
                  {viewsOf?.(active) ?? 0} просмотров
                </span>
                <span>{fmtFull(active.ts)}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border-soft)] p-2">
              {mine && onDelete && (
                <button
                  onClick={() => {
                    onDelete(active.id);
                    setActive(null);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all duration-200 hover:bg-rose-500/10 active:scale-95"
                >
                  <TrashIcon className="h-4 w-4" />
                  Удалить
                </button>
              )}
              <button
                onClick={() => setActive(null)}
                className="flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-all duration-200 hover:brightness-110 active:scale-95"
              >
                <XIcon className="h-4 w-4" />
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Convenience hook resolving a post's view counter: the author's unique-viewer
// tally and the broadcast total are merged (whichever is larger wins).
export function usePostViews() {
  const postViewers = useSelector((s) => s.app.postViewers);
  return (post) => Math.max(post.views ?? 0, postViewers?.[post.id]?.length ?? 0);
}
