import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useWebSocket } from "../../context/WebSocketContext";
import { fileToAvatarDataURL } from "../../lib/image";
import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import PanelToast from "./PanelToast";
import { XIcon, CameraIcon, UsersIcon, SearchIcon, CheckIcon } from "../icons";

const PURPLE_GRAD = "linear-gradient(135deg,#8b5cf6,#6366f1)";

// Create a group: photo + name + optional bio, then pick friends to add.
export default function NewGroupPanel({ onClose }) {
  const navigate = useNavigate();
  const { contacts, createRoom } = useWebSocket();
  const me = useSelector((s) => s.auth.user);
  const fileRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState({}); // email -> true
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("success");

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

  const chosen = Object.keys(selected).filter((e) => selected[e]);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataURL(file));
    } catch {
      setToastTone("error");
      setToast("Не удалось прочитать изображение");
    }
  };

  const toggle = (email) => setSelected((s) => ({ ...s, [email]: !s[email] }));

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await createRoom({
      kind: "group",
      name: name.trim(),
      bio: bio.trim(),
      avatar,
      members: chosen,
    });
    setBusy(false);
    if (!res?.ok) {
      setToastTone("error");
      setToast(res?.error || "Не удалось создать группу");
      return;
    }
    setToastTone("success");
    setToast("Группа создана");
    setTimeout(() => {
      onClose();
      navigate(`/room/${res.room.id}`);
    }, 700);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">Новая группа</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {/* Photo + name row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="so-pop group relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ring)] transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            style={{ background: PURPLE_GRAD }}
            aria-label="Фото группы"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-white">
                <CameraIcon className="h-6 w-6" />
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            placeholder="Название группы"
            className="grow rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#9db0f7]/60"
          />
        </div>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={255}
          rows={2}
          placeholder="Описание (необязательно)"
          className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#9db0f7]/60"
        />

        <div className="mt-4 mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-mid)]">Добавить участников</p>
          <span className="text-xs text-[var(--text-muted)]">{chosen.length} выбрано</span>
        </div>

        <label className="mb-2 flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск друзей"
            className="grow bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </label>

        {filtered.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">
            Нет друзей для добавления
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c, i) => {
              const on = Boolean(selected[c.email]);
              return (
                <li key={c.id} className="so-row" style={{ animationDelay: `${i * 25}ms` }}>
                  <button
                    onClick={() => toggle(c.email)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-[var(--surface-3)] active:scale-[0.99]"
                  >
                    <Avatar user={c} size="md" tone="primary" />
                    <span className="min-w-0 flex-1 truncate font-medium text-[var(--text)]">
                      {nameOf(c)}
                    </span>
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200"
                      style={{
                        background: on ? PURPLE_GRAD : "transparent",
                        borderColor: on ? "transparent" : "var(--border)",
                      }}
                    >
                      {on && <CheckIcon className="h-4 w-4 text-white" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <button
          onClick={create}
          disabled={!name.trim() || busy}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          style={{ background: PURPLE_GRAD }}
        >
          <UsersIcon className="h-5 w-5" />
          {busy ? "Создание…" : "Создать группу"}
        </button>
      </div>

      <PanelToast message={toast} onDone={() => setToast("")} tone={toastTone} />
    </div>
  );
}
