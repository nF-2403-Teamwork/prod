import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { useWebSocket } from "../context/WebSocketContext";
import EmojiPicker from "../components/EmojiPicker";
import Avatar from "../components/Avatar";
import RoomAvatar from "../components/RoomAvatar";
import SlideOver from "../components/panels/SlideOver";
import RoomPanel from "../components/panels/RoomPanel";
import {
  ArrowLeftIcon,
  SendIcon,
  SmileIcon,
  PaperclipIcon,
  SettingsIcon,
  MegaphoneIcon,
  UsersIcon,
} from "../components/icons";
import { nameOf, clockTime } from "../lib/format";

const MAX_ATTACH = 3 * 1024 * 1024; // 3MB — keeps base64 under the ~5MB socket cap
const PURPLE_GRAD = "linear-gradient(120deg, #8b5cf6 0%, #c4b5fd 100%)";
const BUBBLE_GRAD = "linear-gradient(120deg, #7c5cf5 0%, #9d78f2 100%)";

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const formatSize = (n) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`;

function dayLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "TODAY";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString([], { day: "2-digit", month: "long" });
}

export default function RoomConversation() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const me = useSelector((s) => s.auth.user);
  const myEmail = me?.email;
  const { ready, rooms, roomsLoaded, roomMessages, loadRoomHistory, sendRoomMessage } =
    useWebSocket();

  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);

  // Wait for the session to attach: on a cold reload the socket connects before
  // auth:attach lands, and an early history fetch comes back empty.
  useEffect(() => {
    setHistory([]);
    if (!ready || !roomId) return undefined;
    let cancelled = false;
    loadRoomHistory(roomId).then((res) => {
      if (!cancelled && res?.ok) setHistory(res.messages);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, roomId, loadRoomHistory]);

  // History is fetched once; `room:message` pushes land in roomMessages. Merge
  // by id so a live message that arrived before the fetch isn't shown twice.
  const live = roomMessages[roomId];
  const thread = useMemo(() => {
    const byId = new Map();
    for (const m of history) byId.set(m.id, m);
    for (const m of live ?? []) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => a.ts - b.ts);
  }, [history, live]);

  const memberOf = useMemo(() => {
    const map = {};
    for (const m of room?.members ?? []) map[m.email] = m;
    return map;
  }, [room?.members]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !room) return;
    const res = await sendRoomMessage(room.id, text);
    if (res?.ok) {
      setDraft("");
      setShowEmoji(false);
      inputRef.current?.focus();
    } else {
      setAttachError(res?.error || "Не удалось отправить");
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !room) return;
    setAttachError("");
    if (file.size > MAX_ATTACH) {
      setAttachError("Файл слишком большой (макс 3 МБ)");
      return;
    }
    const data = await readFileAsDataURL(file);
    const kind = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "voice"
          : "file";
    const res = await sendRoomMessage(room.id, "", {
      kind,
      attachment: { name: file.name, type: file.type, size: file.size, data },
    });
    if (!res?.ok) setAttachError(res?.error || "Не удалось отправить");
  };

  if (!room) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        {!roomsLoaded ? (
          <span className="loading loading-spinner loading-md" />
        ) : (
          <>
            <p className="font-medium text-[var(--text-mid)]">Комната недоступна</p>
            <p>Она была удалена или вы больше не участник.</p>
            <Link to="/" className="mt-2 text-sm font-medium text-[var(--accent)]">
              К чатам
            </Link>
          </>
        )}
      </div>
    );
  }

  const channel = room.kind === "channel";
  const onlineCount = room.members?.filter((m) => m.online).length ?? 0;
  const countLabel = `${room.memberCount} ${channel ? "подписчик(ов)" : "участник(ов)"}`;
  const KindGlyph = channel ? MegaphoneIcon : UsersIcon;

  let lastDay = null;
  let lastSender = null;

  return (
    <div className="flex h-full flex-col">
      <header className="relative flex items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3">
        <Link
          to="/"
          className="-ml-1 rounded-lg p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)] md:hidden"
          aria-label="Назад"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>

        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-[var(--surface-hover)]"
          aria-label={`Управление: ${room.name}`}
        >
          <RoomAvatar room={room} size="md" className="ring-2 ring-[var(--ring)]" />
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <KindGlyph className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-[17px] font-semibold text-[var(--text-strong)]">
                {room.name}
              </span>
            </span>
            <span className="block truncate text-xs text-[var(--text-muted)]">
              {countLabel}
              {onlineCount > 0 && ` · ${onlineCount} в сети`}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
          aria-label="Управление комнатой"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-label="Сообщения"
        className="flex-1 space-y-2 overflow-y-auto px-4 py-5 sm:px-8"
      >
        {thread.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-[var(--text-muted)]">
            {channel ? "В канале пока нет публикаций." : "Нет сообщений. Напишите первым!"}
          </div>
        ) : (
          thread.map((m) => {
            const mine = m.from === myEmail;
            const sender = memberOf[m.from] ?? { email: m.from };
            const isMedia = m.kind !== "text" && m.attachment;
            const day = new Date(m.ts).toDateString();
            const showSep = day !== lastDay;
            // Name + avatar only on the first message of a run from one sender.
            const showSender = !mine && (showSep || lastSender !== m.from);
            lastDay = day;
            lastSender = m.from;
            return (
              <div key={m.id}>
                {showSep && (
                  <div className="my-4 flex justify-center">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mid)]">
                      {dayLabel(m.ts)}
                    </span>
                  </div>
                )}
                <div
                  className={`msg-in flex items-end gap-2 ${
                    mine ? "msg-in-right justify-end" : "msg-in-left justify-start"
                  }`}
                >
                  {!mine &&
                    (showSender ? (
                      <Avatar user={sender} size="sm" className="shrink-0" />
                    ) : (
                      <span className="h-9 w-9 shrink-0" aria-hidden />
                    ))}
                  <div className={`max-w-[74%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`break-words px-4 py-2.5 text-[15px] leading-relaxed ${
                        mine
                          ? "rounded-2xl rounded-br-md text-white"
                          : "rounded-2xl rounded-bl-md border border-[var(--border)] text-[var(--text)]"
                      } ${isMedia ? "!p-1.5" : "whitespace-pre-wrap"}`}
                      style={
                        mine
                          ? {
                              background: BUBBLE_GRAD,
                              boxShadow: "0 8px 24px -12px rgba(150,110,245,.6)",
                            }
                          : { background: "var(--recv-bubble)" }
                      }
                    >
                      {showSender && !isMedia && (
                        <span className="mb-0.5 block text-xs font-semibold text-[var(--accent)]">
                          {nameOf(sender)}
                        </span>
                      )}
                      {m.kind === "image" && m.attachment ? (
                        <img
                          src={m.attachment.data}
                          alt={m.attachment.name}
                          className="max-h-64 rounded-xl"
                        />
                      ) : m.kind === "video" && m.attachment ? (
                        <video
                          src={m.attachment.data}
                          controls
                          playsInline
                          className="max-h-72 rounded-xl"
                        />
                      ) : m.kind === "voice" && m.attachment ? (
                        <audio src={m.attachment.data} controls className="max-w-full" />
                      ) : m.attachment ? (
                        <a
                          href={m.attachment.data}
                          download={m.attachment.name}
                          className="flex items-center gap-2 rounded-lg p-1.5"
                        >
                          <PaperclipIcon className="h-5 w-5 shrink-0" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{m.attachment.name}</span>
                            <span className="text-xs opacity-70">
                              {formatSize(m.attachment.size)}
                            </span>
                          </span>
                        </a>
                      ) : (
                        m.text
                      )}
                    </div>
                    <div
                      className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-[var(--text-faint)] ${
                        mine ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span>{clockTime(m.ts)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {attachError && (
        <div
          role="alert"
          className="mx-4 mb-2 rounded-xl border border-[#ff5d6c]/30 bg-[#ff5d6c]/10 px-4 py-2 text-sm text-[#ffb4ab]"
        >
          {attachError}
        </div>
      )}

      {room.canPost ? (
        <form onSubmit={send} className="relative px-4 pb-4 pt-2 sm:px-8">
          {showEmoji && (
            <EmojiPicker
              onSelect={(emoji) => {
                setDraft((d) => d + emoji);
                inputRef.current?.focus();
              }}
              onClose={() => setShowEmoji(false)}
            />
          )}
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 backdrop-blur">
            <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
              aria-label="Эмодзи"
              aria-expanded={showEmoji}
            >
              <SmileIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
              aria-label="Прикрепить файл"
            >
              <PaperclipIcon className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFile}
              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.zip"
            />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={channel ? "Написать в канал…" : "Напишите сообщение…"}
              className="grow bg-transparent px-2 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
              aria-label="Сообщение"
              maxLength={2000}
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110 disabled:opacity-40"
              style={{ background: PURPLE_GRAD }}
              disabled={!draft.trim()}
              aria-label="Отправить"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="px-4 pb-4 pt-2 sm:px-8">
          <p className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-center text-sm text-[var(--text-muted)]">
            {channel
              ? "В канале могут писать только администраторы"
              : "У вас нет прав писать в этой группе"}
          </p>
        </div>
      )}

      <SlideOver
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        side="right"
        label="Управление комнатой"
      >
        <RoomPanel
          room={room}
          onClose={() => setManageOpen(false)}
          onGone={() => {
            setManageOpen(false);
            navigate("/", { replace: true });
          }}
        />
      </SlideOver>
    </div>
  );
}
