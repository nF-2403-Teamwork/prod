import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";

import { useWebSocket } from "../context/WebSocketContext";
import { useCall } from "../context/CallContext";
import EmojiPicker from "../components/EmojiPicker";
import Avatar from "../components/Avatar";
import AudioMessage from "../components/AudioMessage";
import VoiceRecorder from "../components/VoiceRecorder";
import RoundVideoRecorder from "../components/RoundVideoRecorder";
import GiftPicker from "../components/GiftPicker";
import {
  ArrowLeftIcon,
  SendIcon,
  SmileIcon,
  PaperclipIcon,
  CheckIcon,
  CheckCheckIcon,
  VerifiedIcon,
  CameraIcon,
  PhoneIcon,
  ChatBubbleIcon,
  BookmarkIcon,
  MicIcon,
  VideoIcon,
  GiftIcon,
} from "../components/icons";
import { nameOf, clockTime, lastSeenText } from "../lib/format";

const MAX_ATTACH = 3 * 1024 * 1024; // 3MB — keeps base64 under the ~5MB socket cap
const PURPLE_GRAD = "linear-gradient(120deg, #8b5cf6 0%, #c4b5fd 100%)";
// Sent bubbles: a touch deeper so white body text keeps good contrast.
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

// Day-separator label for the message list ("TODAY" / "YESTERDAY" / date).
function dayLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "TODAY";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString([], { day: "2-digit", month: "long" });
}

// Segmented call/chat control in the header. Active segment = gradient pill.
function HeaderPill({ active, icon, label, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
        active ? "text-white" : "text-[var(--text-mid)] hover:bg-[var(--surface-hover)]"
      } ${disabled ? "cursor-not-allowed" : ""}`}
      style={
        active
          ? { background: PURPLE_GRAD, boxShadow: "0 6px 20px -8px rgba(150,110,245,.7)" }
          : undefined
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function Conversation() {
  const { contactId } = useParams();
  const me = useSelector((s) => s.auth.user);
  const myEmail = me?.email;
  const { openContactProfile } = useOutletContext() ?? {};
  const { ready, contacts, messages, typing, loadHistory, sendMessage, markRead, sendTyping, sendGift } =
    useWebSocket();
  const { startCall } = useCall();

  // "Saved Messages" is a conversation with yourself (contactId === my id).
  const isSelf = Boolean(me?.id && contactId === me.id);

  const contact = useMemo(() => {
    if (isSelf) return { ...me, online: true, isSelf: true };
    return contacts.find((c) => c.id === contactId);
  }, [contacts, contactId, isSelf, me]);

  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [recording, setRecording] = useState(false); // voice recording active
  const [videoOpen, setVideoOpen] = useState(false); // round-video modal open
  const [giftOpen, setGiftOpen] = useState(false); // gift picker modal open
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const typingStop = useRef(null);

  const thread = (contact && messages[contact.email]) || [];
  const isTyping = Boolean(contact && typing[contact.email]);

  // Wait for the session to attach: on a cold reload the socket connects before
  // auth:attach lands, and an early history fetch comes back empty.
  useEffect(() => {
    if (ready && contact?.email) loadHistory(contact.email);
  }, [ready, contact?.email, loadHistory]);

  // Mark incoming as read on open and as new messages arrive while open.
  useEffect(() => {
    if (ready && contact?.email) markRead(contact.email);
  }, [ready, contact?.email, thread.length, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, isTyping]);

  const stopTyping = () => {
    if (contact) sendTyping(contact.email, false);
    clearTimeout(typingStop.current);
  };

  const handleInput = (v) => {
    setDraft(v);
    if (!contact) return;
    sendTyping(contact.email, true);
    clearTimeout(typingStop.current);
    typingStop.current = setTimeout(() => sendTyping(contact.email, false), 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !contact) return;
    const res = await sendMessage(contact.email, text);
    if (res?.ok) {
      setDraft("");
      setShowEmoji(false);
      stopTyping();
      inputRef.current?.focus();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !contact) return;
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
    await sendMessage(contact.email, "", {
      kind,
      attachment: { name: file.name, type: file.type, size: file.size, data },
    });
  };

  // Encoded voice/round-video clips coming from the recorders.
  const sendMedia = async ({ kind, attachment }) => {
    setRecording(false);
    setVideoOpen(false);
    if (!contact) return;
    setAttachError("");
    await sendMessage(contact.email, "", { kind, attachment });
  };

  const startVoice = () => {
    setShowEmoji(false);
    setAttachError("");
    setRecording(true);
  };

  if (!contact) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
        Loading conversation…
      </div>
    );
  }

  const localTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const title = isSelf ? "Saved Messages" : nameOf(contact);
  const roleOrStatus = isSelf
    ? "Личное облако — только вы"
    : isTyping
      ? "печатает…"
      : contact.description?.trim()
        ? contact.description.trim()
        : contact.online
          ? "online"
          : lastSeenText(contact.lastSeen);

  let lastDay = null;

  return (
    <div className="page-in flex h-full flex-col">
      {/* Contact header (raised) + call/chat control */}
      <header className="relative flex flex-col items-center gap-2 border-b border-[var(--border-soft)] px-4 pb-4 pt-4">
        <Link
          to="/"
          className="absolute left-3 top-3 rounded-lg p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)] md:hidden"
          aria-label="Назад"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>

        <div className="relative shrink-0">
          {isSelf ? (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-white ring-2 ring-[var(--ring)]"
              style={{ background: "linear-gradient(135deg,#38bdf8,#6366f1)" }}
            >
              <BookmarkIcon className="h-7 w-7" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => openContactProfile?.(contact)}
              className="relative rounded-full transition hover:brightness-110"
              aria-label={`Профиль ${nameOf(contact)}`}
            >
              <Avatar
                user={contact}
                size="lg"
                tone="primary"
                className="rounded-full ring-2 ring-[var(--ring)]"
              />
              <span
                className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full ring-2 ring-[var(--dot-ring)]"
                style={{ background: contact.online ? "#34d399" : "#6f6d80" }}
              />
            </button>
          )}
        </div>

        <div className="text-center">
          <h2 className="flex items-center justify-center gap-1 text-lg font-semibold text-[var(--text-strong)]">
            <span className="truncate">{title}</span>
            {!isSelf && contact.verified && (
              <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />
            )}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {roleOrStatus}
            {!isSelf && ` • Local time ${localTime}`}
          </p>
        </div>

        {!isSelf && (
          <div className="mt-1 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--field)] p-1">
            <HeaderPill
              icon={<CameraIcon className="h-4 w-4" />}
              label="Video"
              disabled={!contact.online}
              title={!contact.online ? "Пользователь не в сети" : undefined}
              onClick={() => startCall(contact, true)}
            />
            <HeaderPill
              icon={<PhoneIcon className="h-4 w-4" />}
              label="Audio"
              disabled={!contact.online}
              title={!contact.online ? "Пользователь не в сети" : undefined}
              onClick={() => startCall(contact, false)}
            />
            <HeaderPill active icon={<ChatBubbleIcon className="h-4 w-4" />} label="Chat" />
          </div>
        )}
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-label="Сообщения"
        className="flex-1 space-y-2 overflow-y-auto px-4 py-5 sm:px-8"
      >
        {thread.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-[var(--text-muted)]">
            {isSelf
              ? "Сохраняйте здесь заметки, ссылки и файлы — как избранное."
              : "Нет сообщений. Напишите первым!"}
          </div>
        ) : (
          thread.map((m) => {
            const mine = m.from === myEmail;
            const isMedia = m.kind !== "text" && m.attachment;
            const isRoundVideo = m.kind === "video" && m.attachment?.round;
            const day = new Date(m.ts).toDateString();
            const showSep = day !== lastDay;
            lastDay = day;
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
                  {!mine && !isSelf && (
                    <Avatar user={contact} size="sm" tone="primary" className="shrink-0" />
                  )}
                  <div className={`max-w-[74%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    {isRoundVideo ? (
                      <video
                        src={m.attachment.data}
                        controls
                        playsInline
                        className="h-56 w-56 rounded-full object-cover shadow-lg ring-2 ring-[var(--ring)]"
                      />
                    ) : (
                      <div
                        className={`break-words px-4 py-2.5 text-[15px] leading-relaxed ${
                          mine
                            ? "rounded-2xl rounded-br-md text-white"
                            : "rounded-2xl rounded-bl-md border border-[var(--border)] text-[var(--text)]"
                        } ${isMedia ? "!p-1.5" : "whitespace-pre-wrap"}`}
                        style={
                          mine
                            ? { background: BUBBLE_GRAD, boxShadow: "0 8px 24px -12px rgba(150,110,245,.6)" }
                            : { background: "var(--recv-bubble)" }
                        }
                      >
                        {m.kind === "image" && m.attachment ? (
                          <img
                            src={m.attachment.data}
                            alt={m.attachment.name}
                            className="max-h-64 rounded-xl"
                          />
                        ) : m.kind === "voice" && m.attachment ? (
                          <AudioMessage
                            src={m.attachment.data}
                            duration={m.attachment.duration}
                            mine={mine}
                          />
                        ) : m.kind === "video" && m.attachment ? (
                          <video
                            src={m.attachment.data}
                            controls
                            playsInline
                            className="max-h-72 rounded-xl"
                          />
                        ) : m.kind === "file" && m.attachment ? (
                          <a
                            href={m.attachment.data}
                            download={m.attachment.name}
                            className="flex items-center gap-2 rounded-lg p-1.5"
                          >
                            <PaperclipIcon className="h-5 w-5 shrink-0" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {m.attachment.name}
                              </span>
                              <span className="text-xs opacity-70">
                                {formatSize(m.attachment.size)}
                              </span>
                            </span>
                          </a>
                        ) : m.kind === "gift" && m.gift ? (
                          <div className="flex flex-col items-center gap-1 px-3 py-2 text-center">
                            <span className="msg-in text-4xl leading-none">{m.gift.emoji}</span>
                            <span className="text-sm font-semibold">{m.gift.name}</span>
                            {m.gift.note && (
                              <span
                                className={`text-xs ${
                                  mine ? "text-white/70" : "text-[var(--text-muted)]"
                                }`}
                              >
                                {m.gift.note}
                              </span>
                            )}
                            <span
                              className={`text-[10px] ${
                                mine ? "text-white/60" : "text-[var(--text-faint)]"
                              }`}
                            >
                              {mine ? "Вы отправили подарок" : "Вам подарок"}
                            </span>
                          </div>
                        ) : (
                          m.text
                        )}
                      </div>
                    )}
                    <div
                      className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-[var(--text-faint)] ${
                        mine ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span>{clockTime(m.ts)}</span>
                      {mine && (
                        <span aria-label={m.read ? "Прочитано" : "Отправлено"}>
                          {m.read ? (
                            <CheckCheckIcon className="h-3.5 w-3.5 text-[#8fe3f5]" />
                          ) : (
                            <CheckIcon className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div
            className={`msg-in flex items-end gap-2 ${
              isSelf ? "msg-in-right justify-end" : "msg-in-left justify-start"
            }`}
          >
            {!isSelf && (
              <Avatar user={contact} size="sm" tone="primary" className="shrink-0" />
            )}
            <div
              className={`px-4 py-3 ${
                isSelf
                  ? "rounded-2xl rounded-br-md text-white"
                  : "rounded-2xl rounded-bl-md border border-[var(--border)]"
              }`}
              style={
                isSelf
                  ? { background: BUBBLE_GRAD }
                  : { background: "var(--recv-bubble)" }
              }
            >
              <span
                className={`loading loading-dots loading-sm ${
                  isSelf ? "text-white/90" : "text-[var(--text-mid)]"
                }`}
              />
            </div>
          </div>
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

      {/* Bottom input — one glass pill holding the controls. While recording a
          voice message the pill is replaced by the recorder bar. */}
      <form onSubmit={handleSend} className="relative px-4 pb-4 pt-2 sm:px-8">
        {showEmoji && !recording && (
          <EmojiPicker
            onSelect={(emoji) => {
              setDraft((d) => d + emoji);
              inputRef.current?.focus();
            }}
            onClose={() => setShowEmoji(false)}
          />
        )}
        {recording ? (
          <VoiceRecorder
            maxBytes={MAX_ATTACH}
            onSend={sendMedia}
            onCancel={() => setRecording(false)}
            onError={(msg) => {
              setAttachError(msg);
              setRecording(false);
            }}
          />
        ) : (
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
          <button
            type="button"
            onClick={() => {
              setShowEmoji(false);
              setGiftOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-mid)] transition-all duration-200 hover:scale-110 hover:bg-[var(--surface-hover)] active:scale-95"
            aria-label="Отправить подарок"
          >
            <GiftIcon className="h-5 w-5" />
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
            onChange={(e) => handleInput(e.target.value)}
            onBlur={stopTyping}
            placeholder="Напишите сообщение…"
            className="grow bg-transparent px-2 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
            aria-label="Сообщение"
            maxLength={2000}
          />
          <button
            type="button"
            onClick={startVoice}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
            aria-label="Записать голосовое"
          >
            <MicIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowEmoji(false);
              setAttachError("");
              setVideoOpen(true);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
            aria-label="Записать видеосообщение"
          >
            <VideoIcon className="h-5 w-5" />
          </button>
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
        )}
      </form>

      <GiftPicker
        open={giftOpen}
        recipientName={nameOf(contact)}
        onClose={() => setGiftOpen(false)}
        onSend={async (g) => await sendGift(contact.email, g)}
      />

      {videoOpen && (
        <RoundVideoRecorder
          maxBytes={MAX_ATTACH}
          onSend={sendMedia}
          onClose={() => setVideoOpen(false)}
          onError={(msg) => {
            setAttachError(msg);
            setVideoOpen(false);
          }}
        />
      )}
    </div>
  );
}
