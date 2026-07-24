import { useState } from "react";
import { useSelector } from "react-redux";

import { nameOf, initialsOf } from "../../lib/format";
import { useWebSocket } from "../../context/WebSocketContext";
import PanelToast from "./PanelToast";
import PostGrid, { usePostViews } from "../PostGrid";
import PostComposer from "../PostComposer";
import {
  ArrowLeftIcon,
  PencilIcon,
  QrIcon,
  VerifiedIcon,
  GiftIcon,
  ChevronDownIcon,
  MegaphoneIcon,
  PlusIcon,
} from "../icons";

const PURPLE_GRAD = "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";

// One "value over label" info row (Telegram-style profile field). The outer
// element is a plain div so an interactive `right` control (e.g. the QR button)
// never nests inside another <button>.
function InfoRow({ value, label, valueClass = "", right, onClick, muted }) {
  const body = (
    <>
      <div className={`truncate text-[15px] ${muted ? "text-[var(--text-faint)]" : "text-[var(--text-strong)]"} ${valueClass}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[13px] text-[var(--text-muted)]">{label}</div>
    </>
  );
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="-my-1 min-w-0 flex-1 rounded-lg py-1 text-left transition hover:bg-[var(--surface-2)]"
        >
          {body}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}
      {right}
    </div>
  );
}

// Read-only profile view, styled after the Telegram profile screen. The pencil
// (top-right) opens the full editor. The right-side drawer is gone — this opens
// from the left settings menu.
export default function ProfilePanel({ onClose, onEdit }) {
  const me = useSelector((s) => s.auth.user);
  const channels = useSelector((s) => s.app.channels);
  const gifts = useSelector((s) => s.app.giftsByEmail?.[me?.email] ?? []);
  const posts = useSelector((s) => s.app.postsByEmail?.[me?.email] ?? []);
  const { deletePost } = useWebSocket();
  const viewsOf = usePostViews();
  const [toast, setToast] = useState("");

  const [giftsOpen, setGiftsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const bday = me?.birthday
    ? new Date(me.birthday + "T00:00:00").toLocaleDateString([], {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Decorative gradient header with the avatar */}
      <div
        className="relative shrink-0 overflow-hidden pb-6 pt-4"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(139,92,246,.55), transparent 60%)," +
            "radial-gradient(90% 70% at 85% 20%, rgba(99,102,241,.45), transparent 60%)," +
            "linear-gradient(180deg,#1b1830,#151322)",
        }}
      >
        {/* faint dotted texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex items-center justify-between px-3">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/90 transition hover:bg-[var(--surface-hover)]"
            aria-label="Назад"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onEdit}
            className="rounded-full p-2 text-white/90 transition hover:bg-[var(--surface-hover)]"
            aria-label="Редактировать профиль"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-2 flex flex-col items-center">
          <div className="relative">
            {me?.avatar ? (
              <img
                src={me.avatar}
                alt={nameOf(me)}
                className="h-28 w-28 rounded-full object-cover shadow-xl ring-4 ring-[var(--ring)]"
              />
            ) : (
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full text-4xl font-semibold text-white shadow-xl ring-4 ring-[var(--ring)]"
                style={{ background: PURPLE_GRAD }}
              >
                {initialsOf(me)}
              </div>
            )}
            {/* Emoji status glow */}
            <span
              className="absolute -right-1 top-2 flex h-9 w-9 items-center justify-center rounded-full text-lg"
              style={{
                background: "rgba(255,180,60,.18)",
                boxShadow: "0 0 22px 6px rgba(255,180,60,.35)",
              }}
            >
              🦊
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="text-xl font-semibold text-white">{nameOf(me)}</h2>
            {me?.verified && <VerifiedIcon className="h-5 w-5 text-sky-400" />}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <span
              className="flex h-4 min-w-4 items-center justify-center rounded-md px-1 text-[11px] font-bold text-white"
              style={{ background: PURPLE_GRAD }}
            >
              1
            </span>
            <span className="text-[#34d399]">online</span>
          </div>
        </div>
      </div>

      {/* Scrollable info */}
      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <InfoRow
            value={me?.phone || "Добавить номер"}
            muted={!me?.phone}
            label="Mobile"
            onClick={onEdit}
          />
          <div className="mx-4 border-t border-[var(--border-soft)]" />
          <InfoRow
            value={me?.description || "Добавить описание"}
            muted={!me?.description}
            label="Bio"
            onClick={onEdit}
          />
          <div className="mx-4 border-t border-[var(--border-soft)]" />
          <InfoRow
            value={me?.username ? `@${me.username}` : "Добавить имя пользователя"}
            muted={!me?.username}
            label="Username"
            onClick={onEdit}
            right={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToast("QR-код — скоро");
                }}
                className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-white"
                aria-label="QR-код"
              >
                <QrIcon className="h-5 w-5" />
              </button>
            }
          />
          {bday && (
            <>
              <div className="mx-4 border-t border-[var(--border-soft)]" />
              <InfoRow value={bday} label="Birthday" onClick={onEdit} />
            </>
          )}
          <div className="mx-4 border-t border-[var(--border-soft)]" />
          <InfoRow
            value="Closed"
            valueClass="text-[#f87171]"
            label="Business hours"
            right={
              <span className="flex items-center gap-1 text-[13px] text-[#6ea8fe]">
                opens in 3 hours
                <ChevronDownIcon className="h-4 w-4" />
              </span>
            }
          />
          {me?.location && (
            <>
              <div className="mx-4 border-t border-[var(--border-soft)]" />
              <InfoRow
                value={me.location}
                valueClass="text-[#6ea8fe]"
                label="Location"
              />
            </>
          )}
        </div>

        {/* Gifts — real received gifts, expandable inline */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <button
            onClick={() => setGiftsOpen((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-[var(--surface-2)] active:scale-[0.99]"
          >
            <GiftIcon className="h-5 w-5 text-[var(--accent)]" />
            <span className="flex-1 text-left text-[15px] text-[var(--text-strong)]">Подарки</span>
            <span className="text-[15px] font-medium text-[#6ea8fe]">{gifts.length}</span>
            <ChevronDownIcon
              className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-300 ${giftsOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: giftsOpen ? "420px" : "0px", opacity: giftsOpen ? 1 : 0 }}
          >
            {gifts.length === 0 ? (
              <div className="px-4 pb-4 pt-1 text-center text-[13px] text-[var(--text-faint)]">
                Подарков пока нет
              </div>
            ) : (
              <div className="grid max-h-[400px] grid-cols-3 gap-2 overflow-y-auto px-3 pb-3 pt-1">
                {gifts.map((g) => (
                  <div
                    key={g.id}
                    className="so-row flex flex-col items-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-2 py-3 text-center transition-all duration-200 hover:scale-[1.03]"
                    title={g.note || g.name}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="mt-1 w-full truncate text-[12px] text-[var(--text-strong)]">{g.name}</span>
                    <span className="w-full truncate text-[11px] text-[var(--text-muted)]">от {g.from}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts — Telegram-style tile grid; the composer is a story-style
            full-screen editor (text/bg/photo/video) */}
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] pb-1">
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Публикации{posts.length > 0 ? ` (${posts.length})` : ""}
            </span>
            <button
              onClick={() => setComposerOpen(true)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(120deg, #8b5cf6 0%, #a78bfa 100%)" }}
            >
              <PlusIcon className="h-4 w-4" />
              Создать
            </button>
          </div>
          <div className="px-3 pb-2 pt-1">
            {posts.length === 0 ? (
              <div className="px-2 pb-2 pt-1 text-[13px] text-[var(--text-faint)]">
                Публикаций пока нет — поделитесь моментом
              </div>
            ) : (
              <PostGrid posts={posts} mine viewsOf={viewsOf} onDelete={(id) => deletePost(id)} />
            )}
          </div>
        </div>

        {/* Channels created by the user show up on the profile */}
        {channels.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Мои каналы
            </div>
            {channels.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                {c.avatar ? (
                  <img src={c.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ background: PURPLE_GRAD }}
                  >
                    <MegaphoneIcon className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] text-[var(--text-strong)]">{c.name}</div>
                  <div className="truncate text-[13px] text-[var(--text-muted)]">
                    {c.bio || "Канал"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PostComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      <PanelToast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
