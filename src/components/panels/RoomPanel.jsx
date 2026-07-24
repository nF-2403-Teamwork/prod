import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { useWebSocket } from "../../context/WebSocketContext";
import { fileToAvatarDataURL } from "../../lib/image";
import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import RoomAvatar from "../RoomAvatar";
import PanelToast from "./PanelToast";
import {
  XIcon,
  CameraIcon,
  SearchIcon,
  TrashIcon,
  LogOutIcon,
  UserPlusIcon,
} from "../icons";

const PURPLE_GRAD = "linear-gradient(135deg,#8b5cf6,#6366f1)";

const ROLE_LABELS = {
  owner: "Владелец",
  admin: "Админ",
  moderator: "Модератор",
  support: "Поддержка",
  user: "Участник",
  bot: "Бот",
};

// Mirrors prod/src/roles.js: the server only lets you touch members weaker than
// you and only grant roles below your own, so the UI must not offer more.
const RANK = { owner: 5, admin: 4, moderator: 3, support: 2, user: 1, bot: 0 };
const ASSIGNABLE = ["admin", "moderator", "support", "user", "bot"];

// Manage a group/channel: name/bio/avatar, members, roles, leave, delete.
// Every action is gated on `room.permissions` from the server.
export default function RoomPanel({ room, onClose, onGone }) {
  const me = useSelector((s) => s.auth.user);
  const {
    updateRoom,
    deleteRoom,
    addRoomMember,
    removeRoomMember,
    setRoomRole,
    leaveRoom,
    searchUsers,
  } = useWebSocket();

  const fileRef = useRef(null);
  const [name, setName] = useState(room.name);
  const [bio, setBio] = useState(room.bio ?? "");
  const [avatar, setAvatar] = useState(room.avatar ?? null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(null); // email being added/removed/re-roled
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("success");

  const can = (p) => room.permissions?.includes(p);
  const canUpdate = can("room:update");
  const canAdd = can("member:add");
  const canRemove = can("member:remove");
  const canRole = can("member:role");
  const isOwner = room.owner === me?.email;
  const channel = room.kind === "channel";

  // Re-seed the draft only when switching to a different room: rooms:update
  // replaces the `room` object on every membership/message change, and syncing
  // on that would wipe whatever the user is typing.
  useEffect(() => {
    setName(room.name);
    setBio(room.bio ?? "");
    setAvatar(room.avatar ?? null);
    setConfirmDelete(false);
  }, [room.id]);

  useEffect(() => {
    const query = q.trim();
    if (!query || !canAdd) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      setResults(await searchUsers(query));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, canAdd, searchUsers]);

  const memberEmails = useMemo(
    () => new Set(room.members?.map((m) => m.email)),
    [room.members],
  );
  const candidates = useMemo(
    () => results.filter((u) => !memberEmails.has(u.email)),
    [results, memberEmails],
  );

  const dirty =
    name !== room.name || bio !== (room.bio ?? "") || avatar !== (room.avatar ?? null);

  const flash = (msg, tone = "success") => {
    setToastTone(tone);
    setToast(msg);
  };

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataURL(file));
    } catch {
      flash("Не удалось прочитать изображение", "error");
    }
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await updateRoom(room.id, { name: name.trim(), bio: bio.trim(), avatar });
    setSaving(false);
    flash(res?.ok ? "Сохранено" : res?.error || "Не удалось сохранить", res?.ok ? "success" : "error");
  };

  const add = async (email) => {
    setBusy(email);
    const res = await addRoomMember(room.id, email);
    setBusy(null);
    if (res?.ok) {
      setQ("");
      flash("Участник добавлен");
    } else {
      flash(res?.error || "Не удалось добавить", "error");
    }
  };

  const remove = async (email) => {
    setBusy(email);
    const res = await removeRoomMember(room.id, email);
    setBusy(null);
    if (!res?.ok) flash(res?.error || "Не удалось удалить", "error");
  };

  const changeRole = async (email, role) => {
    setBusy(email);
    const res = await setRoomRole(room.id, email, role);
    setBusy(null);
    flash(res?.ok ? "Роль обновлена" : res?.error || "Не удалось изменить роль", res?.ok ? "success" : "error");
  };

  const leave = async () => {
    const res = await leaveRoom(room.id);
    if (res?.ok) onGone?.();
    else flash(res?.error || "Не удалось выйти", "error");
  };

  const destroy = async () => {
    const res = await deleteRoom(room.id);
    if (res?.ok) onGone?.();
    else flash(res?.error || "Не удалось удалить", "error");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">
          {channel ? "Управление каналом" : "Управление группой"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {/* ---- Identity: editable only with room:update ---- */}
        <div className="flex flex-col items-center gap-2">
          {canUpdate ? (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="group relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-[var(--ring)]"
                aria-label="Фото комнаты"
              >
                <RoomAvatar room={{ ...room, avatar }} size="xl" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                  <CameraIcon className="h-6 w-6" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickAvatar}
              />
            </>
          ) : (
            <RoomAvatar room={room} size="xl" className="ring-2 ring-[var(--ring)]" />
          )}
          <span className="text-xs text-[var(--text-muted)]">
            {channel ? "Канал" : "Группа"} · {ROLE_LABELS[room.myRole] ?? room.myRole}
          </span>
        </div>

        {canUpdate ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--text-mid)]" htmlFor="room-name">
                Название
              </label>
              <input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#9db0f7]/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--text-mid)]" htmlFor="room-bio">
                Описание
              </label>
              <textarea
                id="room-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Пару слов"
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#9db0f7]/60"
              />
            </div>
            <button
              onClick={save}
              disabled={!dirty || !name.trim() || saving}
              className="min-h-[44px] w-full rounded-xl text-[15px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              style={{ background: PURPLE_GRAD }}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-[var(--text-strong)]">{room.name}</p>
            {room.bio && <p className="mt-1 text-sm text-[var(--text-muted)]">{room.bio}</p>}
          </div>
        )}

        {/* ---- Members ---- */}
        <div className="mt-6 mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-mid)]">
            {channel ? "Подписчики" : "Участники"}
          </p>
          <span className="text-xs text-[var(--text-muted)]">{room.memberCount}</span>
        </div>

        <ul className="space-y-0.5">
          {room.members?.map((m) => {
            const self = m.email === me?.email;
            const stronger = RANK[room.myRole] > RANK[m.role];
            const editableRole = canRole && !self && m.email !== room.owner && stronger;
            const removable = canRemove && !self && m.email !== room.owner && stronger;
            return (
              <li
                key={m.email}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--surface-3)]"
              >
                <span className="relative shrink-0">
                  <Avatar user={m} size="md" />
                  <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[var(--dot-ring)]"
                    style={{ background: m.online ? "#34d399" : "#6f6d80" }}
                    aria-label={m.online ? "в сети" : "не в сети"}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--text)]">
                    {nameOf(m)}
                    {self && <span className="text-[var(--text-muted)]"> (вы)</span>}
                  </div>
                  <div className="truncate text-xs text-[var(--text-muted)]">{m.email}</div>
                </div>

                {editableRole ? (
                  <select
                    value={m.role}
                    disabled={busy === m.email}
                    onChange={(e) => changeRole(m.email, e.target.value)}
                    aria-label={`Роль: ${nameOf(m)}`}
                    className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--field)] px-2 text-xs text-[var(--text)] outline-none focus:border-[#9db0f7]/60"
                  >
                    {ASSIGNABLE.filter((r) => RANK[room.myRole] > RANK[r]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                )}

                {removable && (
                  <button
                    onClick={() => remove(m.email)}
                    disabled={busy === m.email}
                    aria-label={`Удалить ${nameOf(m)}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[#ff5d6c] disabled:opacity-40"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* ---- Add member ---- */}
        {canAdd && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-[var(--text-mid)]">Добавить участника</p>
            <label className="mb-2 flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 focus-within:border-[#9db0f7]/60">
              <SearchIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по имени или @username"
                aria-label="Поиск пользователей"
                className="grow bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </label>
            {q.trim() &&
              (searching ? (
                <div className="px-3 py-3 text-center text-sm text-[var(--text-muted)]">
                  <span className="loading loading-spinner loading-sm" />
                </div>
              ) : candidates.length === 0 ? (
                <p className="px-3 py-3 text-center text-sm text-[var(--text-muted)]">
                  Никого не найдено
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {candidates.map((u) => (
                    <li
                      key={u.id || u.email}
                      className="flex items-center gap-3 rounded-xl px-2 py-2"
                    >
                      <Avatar user={u} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--text)]">{nameOf(u)}</div>
                        <div className="truncate text-xs text-[var(--text-faint)]">
                          {u.username ? `@${u.username}` : u.email}
                        </div>
                      </div>
                      <button
                        onClick={() => add(u.email)}
                        disabled={busy === u.email}
                        className="flex min-h-[44px] items-center gap-1 rounded-full px-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                        style={{ background: PURPLE_GRAD }}
                      >
                        <UserPlusIcon className="h-4 w-4" />
                        Добавить
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        )}
      </div>

      {/* ---- Danger zone ---- */}
      <div className="space-y-2 border-t border-[var(--border)] p-4">
        {isOwner ? (
          <p className="text-center text-xs text-[var(--text-faint)]">
            Вы владелец — выйти нельзя, только удалить
          </p>
        ) : (
          <button
            onClick={leave}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-[15px] font-medium text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
          >
            <LogOutIcon className="h-5 w-5" />
            Выйти из {channel ? "канала" : "группы"}
          </button>
        )}

        {can("room:delete") &&
          (confirmDelete ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-[var(--text-mid)]">
                Удалить безвозвратно? Сообщения пропадут у всех.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
                >
                  Отмена
                </button>
                <button
                  onClick={destroy}
                  className="min-h-[44px] flex-1 rounded-xl text-sm font-semibold text-white transition hover:brightness-110"
                  style={{ background: "linear-gradient(120deg,#ef4444,#dc2626)" }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#ff5d6c]/30 text-[15px] font-medium text-[#ff5d6c] transition hover:bg-[#ff5d6c]/10"
            >
              <TrashIcon className="h-5 w-5" />
              Удалить {channel ? "канал" : "группу"}
            </button>
          ))}
      </div>

      <PanelToast message={toast} onDone={() => setToast("")} tone={toastTone} />
    </div>
  );
}
