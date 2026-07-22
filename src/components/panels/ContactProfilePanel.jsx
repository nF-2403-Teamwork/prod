import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setContactAvatar, clearContactAvatar } from "../../store/appSlice";
import { fileToAvatarDataURL } from "../../lib/image";
import { nameOf, initialsOf, lastSeenText } from "../../lib/format";
import { useWebSocket } from "../../context/WebSocketContext";
import GiftPicker from "../GiftPicker";
import PostGrid, { usePostViews } from "../PostGrid";
import PanelToast from "./PanelToast";
import {
  ArrowLeftIcon,
  CameraIcon,
  VerifiedIcon,
  ChatBubbleIcon,
  QrIcon,
  GiftIcon,
} from "../icons";

const PURPLE_GRAD = "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";

function InfoRow({ value, label, valueClass = "", muted, right }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-[15px] ${
            muted ? "text-[var(--text-faint)]" : "text-[var(--text-strong)]"
          } ${valueClass}`}
        >
          {value}
        </div>
        <div className="mt-0.5 text-[13px] text-[var(--text-muted)]">{label}</div>
      </div>
      {right}
    </div>
  );
}

// Read-only profile of one of your contacts, opened by tapping their avatar.
// You can also set a local photo for them (their real avatar can be boring).
export default function ContactProfilePanel({ contact, onClose, onMessage }) {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [toast, setToast] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const { sendGift, viewPost } = useWebSocket();
  const viewsOf = usePostViews();
  const override = useSelector((s) =>
    contact?.email ? s.app.contactAvatars?.[contact.email] : null,
  );
  const rawPosts = useSelector((s) =>
    contact?.email ? s.app.postsByEmail?.[contact.email] : null,
  );
  const rawGifts = useSelector((s) =>
    contact?.email ? s.app.giftsByEmail?.[contact.email] : null,
  );

  const posts = rawPosts ?? [];

  useEffect(() => {
    if (!contact?.email) return;
    for (const p of posts) viewPost(contact.email, p.id);
    // viewPost dedupes internally, so re-runs are harmless
  }, [contact?.email, posts, viewPost]);

  if (!contact) return null;

  const gifts = rawGifts ?? [];

  const src = override || contact.avatar;
  const bday = contact.birthday
    ? new Date(contact.birthday + "T00:00:00").toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const avatar = await fileToAvatarDataURL(file);
      dispatch(setContactAvatar({ email: contact.email, avatar }));
      setToast("Фото контакта обновлено");
    } catch {
      setToast("Не удалось прочитать изображение");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Gradient header */}
      <div
        className="relative shrink-0 overflow-hidden pb-6 pt-4"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(139,92,246,.55), transparent 60%)," +
            "radial-gradient(90% 70% at 85% 20%, rgba(99,102,241,.45), transparent 60%)," +
            "linear-gradient(180deg,#1b1830,#151322)",
        }}
      >
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
            className="rounded-full p-2 text-white/90 transition hover:bg-white/10"
            aria-label="Назад"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-2 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-28 w-28 overflow-hidden rounded-full shadow-xl ring-4 ring-white/10"
            style={{ background: PURPLE_GRAD }}
            aria-label="Поставить фото контакту"
          >
            {src ? (
              <img src={src} alt={nameOf(contact)} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-white">
                {initialsOf(contact)}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <CameraIcon className="h-6 w-6" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />

          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="text-xl font-semibold text-white">{nameOf(contact)}</h2>
            {contact.verified && <VerifiedIcon className="h-5 w-5 text-sky-400" />}
          </div>
          <div className="mt-1 text-sm" style={{ color: contact.online ? "#34d399" : "rgba(255,255,255,.6)" }}>
            {contact.online ? "online" : lastSeenText(contact.lastSeen)}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
            >
              {src ? "Изменить фото" : "Поставить фото"}
            </button>
            {override && (
              <button
                onClick={() => {
                  dispatch(clearContactAvatar(contact.email));
                  setToast("Фото сброшено");
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 transition hover:bg-white/20"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <InfoRow
            value={contact.username ? `@${contact.username}` : "нет имени пользователя"}
            muted={!contact.username}
            label="Username"
            right={
              contact.username ? (
                <button
                  onClick={() => setToast("QR-код — скоро")}
                  className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]"
                  aria-label="QR-код"
                >
                  <QrIcon className="h-5 w-5" />
                </button>
              ) : null
            }
          />
          {contact.phone && (
            <>
              <div className="mx-4 border-t border-[var(--border-soft)]" />
              <InfoRow value={contact.phone} label="Mobile" />
            </>
          )}
          {contact.description && (
            <>
              <div className="mx-4 border-t border-[var(--border-soft)]" />
              <InfoRow value={contact.description} label="Bio" />
            </>
          )}
          {bday && (
            <>
              <div className="mx-4 border-t border-[var(--border-soft)]" />
              <InfoRow value={bday} label="Birthday" />
            </>
          )}
          {contact.location && (
            <>
              <div className="mx-4 border-t border-[var(--border-soft)]" />
              <InfoRow value={contact.location} valueClass="text-[#6ea8fe]" label="Location" />
            </>
          )}
          <div className="mx-4 border-t border-[var(--border-soft)]" />
          <InfoRow value={contact.email} label="Email" />
        </div>

        {/* Posts */}
        {posts.length > 0 && (
          <div className="so-row mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 text-[13px] font-semibold text-[var(--text-muted)]">
              Публикации
            </div>
            <PostGrid
              posts={posts}
              viewsOf={viewsOf}
              onOpen={(p) => viewPost(contact.email, p.id)}
            />
          </div>
        )}

        {/* Gifts */}
        <div className="so-row mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-[var(--text-muted)]">
              Подарки{gifts.length ? ` (${gifts.length})` : ""}
            </div>
            <button
              onClick={() => setGiftOpen(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
              style={{ background: PURPLE_GRAD }}
            >
              <GiftIcon className="h-4 w-4" />
              Подарить
            </button>
          </div>
          {gifts.length ? (
            <div className="grid grid-cols-4 gap-2">
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className="so-pop flex flex-col items-center gap-1 rounded-xl bg-[var(--surface-2)] p-2.5 transition-all duration-200 hover:scale-105"
                  title={g.note || g.name}
                >
                  <span className="text-3xl">{g.emoji}</span>
                  <span className="w-full truncate text-center text-[10px] text-[var(--text-muted)]">
                    {g.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-faint)]">Подарков пока нет</p>
          )}
        </div>

        <button
          onClick={() => onMessage?.(contact)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[15px] font-semibold text-white transition hover:brightness-110"
          style={{ background: PURPLE_GRAD }}
        >
          <ChatBubbleIcon className="h-5 w-5" />
          Написать сообщение
        </button>
      </div>

      <GiftPicker
        open={giftOpen}
        recipientName={nameOf(contact)}
        onClose={() => setGiftOpen(false)}
        onSend={async ({ emoji, name, note }) => {
          const res = await sendGift(contact.email, { emoji, name, note });
          if (res?.ok) setToast("Подарок отправлен");
          return res;
        }}
      />
      <PanelToast message={toast} onDone={() => setToast("")} tone="success" />
    </div>
  );
}
