import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useWebSocket } from "../../context/WebSocketContext";
import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import { XIcon, SearchIcon, VerifiedIcon, UsersIcon } from "../icons";

// Your accepted friends (real contacts) + any groups you created. Tapping a
// contact opens the conversation.
export default function ContactsPanel({ onClose, onOpenProfile }) {
  const { contacts } = useWebSocket();
  const groups = useSelector((s) => s.app.groups);
  const me = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const base = contacts.filter((c) => c.email !== me?.email);
    const query = q.trim().toLowerCase();
    const filtered = query
      ? base.filter((c) =>
          `${nameOf(c)} ${c.username ?? ""} ${c.email}`.toLowerCase().includes(query),
        )
      : base;
    return [...filtered].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }, [contacts, q, me?.email]);

  const openChat = (c) => {
    navigate(`/chat/${c.id}`);
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">Контакты</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 focus-within:border-[#9db0f7]/60">
          <SearchIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск контактов"
            className="grow bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </label>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {groups.length > 0 && !q && (
          <div className="mb-2">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Группы
            </p>
            {groups.map((g, i) => (
              <div
                key={g.id}
                className="so-row flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-200 hover:bg-[var(--surface-3)]"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                {g.avatar ? (
                  <img src={g.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
                  >
                    <UsersIcon className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--text)]">{g.name}</div>
                  <div className="truncate text-xs text-[var(--text-muted)]">
                    {g.members?.length || 0} участник(ов)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {list.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text-mid)]">Контактов пока нет</p>
            <p className="mt-1">Найдите друзей по имени или @username в поиске чатов и отправьте заявку.</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {list.map((c, i) => (
              <li key={c.id} className="so-row" style={{ animationDelay: `${i * 25}ms` }}>
                <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-200 hover:bg-[var(--surface-3)]">
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(c)}
                    className="relative shrink-0 rounded-full transition-all duration-200 hover:scale-[1.05] hover:brightness-110 active:scale-95"
                    aria-label={`Профиль ${nameOf(c)}`}
                  >
                    <Avatar user={c} size="md" tone="primary" />
                    <span
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[var(--dot-ring)]"
                      style={{ background: c.online ? "#34d399" : "#6f6d80" }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => openChat(c)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate font-medium text-[var(--text)]">{nameOf(c)}</span>
                      {c.verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />}
                    </div>
                    <div className="truncate text-xs text-[var(--text-muted)]">
                      {c.online ? "в сети" : c.username ? `@${c.username}` : "не в сети"}
                    </div>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
