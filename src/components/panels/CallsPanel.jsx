import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useWebSocket } from "../../context/WebSocketContext";
import { useCall } from "../../context/CallContext";
import { clearCalls } from "../../store/appSlice";
import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import PanelToast from "./PanelToast";
import {
  XIcon,
  PlusIcon,
  PhoneIcon,
  VideoIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  PhoneMissedIcon,
  ArrowLeftIcon,
  SearchIcon,
} from "../icons";

const fmtDur = (s) =>
  s <= 0 ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function relTime(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const d = new Date(ts);
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

const dirMeta = {
  out: { Icon: PhoneOutgoingIcon, color: "#34d399", label: "Исходящий" },
  in: { Icon: PhoneIncomingIcon, color: "#34d399", label: "Входящий" },
  missed: { Icon: PhoneMissedIcon, color: "#f87171", label: "Пропущенный" },
};

// Recent calls log (persisted locally). Calls are placed through the real
// WebRTC machinery in CallContext; offline contacts get an inline note.
export default function CallsPanel({ onClose }) {
  const dispatch = useDispatch();
  const calls = useSelector((s) => s.app.calls);
  const me = useSelector((s) => s.auth.user);
  const { contacts } = useWebSocket();
  const { startCall } = useCall();
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(null); // { text, tone }

  const friends = useMemo(
    () => contacts.filter((c) => c.email !== me?.email),
    [contacts, me?.email],
  );
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return query
      ? friends.filter((c) => `${nameOf(c)} ${c.email}`.toLowerCase().includes(query))
      : friends;
  }, [friends, q]);

  // Resolve the live contact by email and hand off to the real call stack.
  const placeCall = (email, video) => {
    const live = contacts.find((c) => c.email === email);
    if (!live || !live.online) {
      setToast({ text: "Пользователь не в сети", tone: "error" });
      return;
    }
    setPicking(false);
    setQ("");
    startCall(live, video);
  };

  // Contact picker for a new call
  if (picking) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-3 pb-2 pt-4">
          <button
            onClick={() => setPicking(false)}
            className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
            aria-label="Назад"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--text-strong)]">Новый звонок</h2>
        </div>
        <div className="px-4 pb-2">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3">
            <SearchIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Кому позвонить"
              className="grow bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </label>
        </div>
        <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Нет контактов</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((c) => (
                <li key={c.id} className="so-row">
                  <div className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 hover:bg-[var(--surface-3)]">
                    <Avatar user={c} size="md" tone="primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[var(--text)]">{nameOf(c)}</div>
                      {!c.online && (
                        <div className="text-xs text-[var(--text-faint)]">не в сети</div>
                      )}
                    </div>
                    <button
                      onClick={() => placeCall(c.email, false)}
                      className="rounded-full p-2 text-[#34d399] transition-all duration-200 hover:scale-110 hover:bg-[var(--surface-hover)] active:scale-95"
                      aria-label={`Позвонить: ${nameOf(c)}`}
                    >
                      <PhoneIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => placeCall(c.email, true)}
                      className="rounded-full p-2 text-[var(--accent)] transition-all duration-200 hover:scale-110 hover:bg-[var(--surface-hover)] active:scale-95"
                      aria-label={`Видеозвонок: ${nameOf(c)}`}
                    >
                      <VideoIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <PanelToast
          message={toast?.text ?? ""}
          onDone={() => setToast(null)}
          tone={toast?.tone ?? "info"}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">Звонки</h2>
        <div className="flex items-center gap-1">
          {calls.length > 0 && (
            <button
              onClick={() => {
                dispatch(clearCalls());
                setToast({ text: "Журнал очищен", tone: "success" });
              }}
              className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-hover)] hover:text-white active:scale-95"
            >
              Очистить
            </button>
          )}
          <button
            onClick={() => setPicking(true)}
            className="rounded-full p-2 text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
            aria-label="Новый звонок"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
            aria-label="Закрыть"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {calls.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(139,92,246,.15)" }}
            >
              <PhoneIcon className="h-7 w-7 text-[var(--accent)]" />
            </span>
            <p className="font-medium text-[var(--text-mid)]">Нет недавних звонков</p>
            <p className="text-sm text-[var(--text-muted)]">Начните звонок кнопкой «+» вверху.</p>
            <button
              onClick={() => setPicking(true)}
              className="mt-1 rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
            >
              Новый звонок
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {calls.map((call) => {
              const meta = dirMeta[call.dir] ?? dirMeta.out;
              const DirIcon = call.video ? VideoIcon : meta.Icon;
              const contact = contacts.find((c) => c.email === call.email);
              return (
                <li key={call.id} className="so-row">
                  <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 hover:bg-[var(--field)]">
                    <Avatar
                      user={contact || { firstName: call.name, avatar: call.avatar }}
                      size="md"
                      tone="primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[var(--text)]">{call.name}</div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: meta.color }}>
                        <DirIcon className="h-3.5 w-3.5" />
                        <span>{meta.label}</span>
                        <span className="text-[var(--text-faint)]">· {relTime(call.ts)}</span>
                        {call.duration > 0 && (
                          <span className="text-[var(--text-faint)]">· {fmtDur(call.duration)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => placeCall(call.email, false)}
                      className="rounded-full p-2 text-[#34d399] transition-all duration-200 hover:scale-110 hover:bg-[var(--surface-hover)] active:scale-95"
                      aria-label="Позвонить снова"
                    >
                      <PhoneIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => placeCall(call.email, true)}
                      className="rounded-full p-2 text-[var(--accent)] transition-all duration-200 hover:scale-110 hover:bg-[var(--surface-hover)] active:scale-95"
                      aria-label="Видеозвонок"
                    >
                      <VideoIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <PanelToast
        message={toast?.text ?? ""}
        onDone={() => setToast(null)}
        tone={toast?.tone ?? "info"}
      />
    </div>
  );
}
