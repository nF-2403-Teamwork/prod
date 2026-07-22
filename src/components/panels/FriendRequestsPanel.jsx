import { useState } from "react";

import { useWebSocket } from "../../context/WebSocketContext";
import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import { XIcon, VerifiedIcon, CheckIcon, UserPlusIcon } from "../icons";

const GREEN = "linear-gradient(135deg,#22c55e,#16a34a)";
const RED = "linear-gradient(135deg,#ef4444,#dc2626)";

// "New Friend" — incoming friend requests as a list (photo, name, phone/email)
// with green Принять / red Отклонить. Replaces the old bell notifications.
export default function FriendRequestsPanel({ onClose }) {
  const { notifications, acceptFriend, declineFriend } = useWebSocket();
  const [busy, setBusy] = useState(null);

  const requests = notifications.filter(
    (n) => n.type === "friend_request" && n.status === "pending",
  );

  const act = async (id, fn) => {
    setBusy(id);
    await fn(id);
    setBusy(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">Новые друзья</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {requests.length === 0 ? (
          <div className="so-pop flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(139,92,246,.15)" }}
            >
              <UserPlusIcon className="h-7 w-7 text-[var(--accent)]" />
            </span>
            <p className="font-medium text-[var(--text-mid)]">Нет новых заявок</p>
            <p className="text-sm text-[var(--text-muted)]">
              Когда кто-то захочет добавить вас в друзья, заявка появится здесь.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {requests.map((n, i) => (
              <li
                key={n.id}
                className="so-row rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={n.from} size="md" tone="primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate font-semibold text-[var(--text-strong)]">
                        {nameOf(n.from)}
                      </span>
                      {n.from?.verified && (
                        <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />
                      )}
                    </div>
                    <div className="truncate text-[13px] text-[var(--text-muted)]">
                      {n.from?.phone || n.from?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => act(n.id, acceptFriend)}
                    disabled={busy === n.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{ background: GREEN }}
                  >
                    <CheckIcon className="h-4 w-4" />
                    Принять
                  </button>
                  <button
                    onClick={() => act(n.id, declineFriend)}
                    disabled={busy === n.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{ background: RED }}
                  >
                    <XIcon className="h-4 w-4" />
                    Отклонить
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
