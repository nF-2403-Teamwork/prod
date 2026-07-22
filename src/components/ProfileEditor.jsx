import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { useWebSocket } from "../context/WebSocketContext";
import { fileToAvatarDataURL } from "../lib/image";
import { initialsOf } from "../lib/format";
import { CameraIcon, XIcon, AlertIcon, CheckCircleIcon } from "./icons";

const empty = {
  displayName: "",
  firstName: "",
  lastName: "",
  username: "",
  description: "",
  phone: "",
  birthday: "",
  location: "",
  avatar: null,
};

const fieldCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[#9db0f7]/70 focus:bg-[var(--surface-3)]";
const labelCls = "mb-1.5 block text-[13px] font-medium text-[var(--text-mid)]";

// Full profile editor — a glass modal that matches the app's panels and follows
// the light/dark theme. Opened from Settings → "Изменить профиль" and the
// profile panel's pencil.
export default function ProfileEditor({ open, onClose }) {
  const me = useSelector((s) => s.auth.user);
  const dark = useSelector((s) => s.ui.theme) === "dark";
  const { updateProfile } = useWebSocket();

  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      displayName: me?.displayName ?? "",
      firstName: me?.firstName ?? "",
      lastName: me?.lastName ?? "",
      username: me?.username ?? "",
      description: me?.description ?? "",
      phone: me?.phone ?? "",
      birthday: me?.birthday ?? "",
      location: me?.location ?? "",
      avatar: me?.avatar ?? null,
    });
    setError("");
    setSaved(false);
  }, [open, me]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      set("avatar", await fileToAvatarDataURL(file));
    } catch (err) {
      setError(err.message || "Could not read that image");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim()) return setError("Имя обязательно");
    setSaving(true);
    const res = await updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      displayName: form.displayName.trim(),
      username: form.username.trim(),
      description: form.description.trim(),
      phone: form.phone.trim(),
      birthday: form.birthday,
      location: form.location.trim(),
      avatar: form.avatar,
    });
    setSaving(false);
    if (!res?.ok) return setError(res?.error || "Не удалось сохранить профиль");
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        className="fade-in absolute inset-0 bg-black/55"
        style={{ backdropFilter: "blur(3px)" }}
        onClick={onClose}
        aria-label="Закрыть"
      />

      <div
        className="so-pop relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--border)] shadow-2xl"
        style={{
          background: "var(--panel-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Gradient banner with the overlapping avatar */}
        <div
          className="relative h-24 shrink-0"
          style={{ background: "linear-gradient(120deg,#7c5cf5,#a78bfa 55%,#6ea8fe)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,.7) 1px, transparent 1.4px)",
              backgroundSize: "18px 18px",
            }}
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-black/20 p-2 text-white/90 transition-all duration-200 hover:bg-black/35 active:scale-95"
            aria-label="Закрыть"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group absolute left-1/2 top-full z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-4 ring-[var(--dot-ring)]"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)", boxShadow: "0 12px 30px -12px rgba(90,60,200,.6)" }}
            aria-label="Сменить фото"
          >
            {form.avatar ? (
              <img src={form.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                {initialsOf({ ...me, ...form })}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <CameraIcon className="h-6 w-6" />
            </span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />

        {/* Title + remove-photo below the overlapping avatar */}
        <div className="shrink-0 px-6 pt-14 pb-2 text-center">
          {form.avatar && (
            <button
              type="button"
              className="text-xs font-medium text-[#f87171] transition hover:brightness-110"
              onClick={() => set("avatar", null)}
            >
              Удалить фото
            </button>
          )}
          <h3 className="mt-1 text-lg font-bold text-[var(--text-strong)]">Изменить профиль</h3>
        </div>

        <form onSubmit={save} className="so-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#ff5d6c]/30 bg-[#ff5d6c]/10 px-4 py-3 text-sm text-[#f87171]">
              <AlertIcon className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#34d399]/30 bg-[#34d399]/10 px-4 py-3 text-sm text-[#34d399]">
              <CheckCircleIcon className="h-5 w-5 shrink-0" />
              <span>Профиль сохранён</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="pf-display">Отображаемое имя</label>
              <input
                id="pf-display"
                className={fieldCls}
                placeholder="Как показывается в чатах"
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                maxLength={64}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="pf-first">Имя</label>
                <input
                  id="pf-first"
                  className={fieldCls}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  maxLength={40}
                  required
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pf-last">Фамилия</label>
                <input
                  id="pf-last"
                  className={fieldCls}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  maxLength={40}
                />
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="pf-username">Имя пользователя</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3.5 transition focus-within:border-[#9db0f7]/70">
                <span className="text-[var(--text-muted)]">@</span>
                <input
                  id="pf-username"
                  className="grow bg-transparent py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
                  placeholder="username"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value.toLowerCase())}
                  maxLength={20}
                />
              </div>
              <span className="mt-1 block text-[12px] text-[var(--text-faint)]">
                3–20 символов: a–z, 0–9, _
              </span>
            </div>

            <div>
              <label className={labelCls} htmlFor="pf-desc">Описание</label>
              <textarea
                id="pf-desc"
                className={`${fieldCls} resize-none`}
                placeholder="Пару слов о себе"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="pf-phone">Телефон</label>
                <input
                  id="pf-phone"
                  className={fieldCls}
                  placeholder="+998 99 000 00 00"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  maxLength={32}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pf-birthday">Дата рождения</label>
                <input
                  id="pf-birthday"
                  type="date"
                  className={fieldCls}
                  style={{ colorScheme: dark ? "dark" : "light" }}
                  value={form.birthday}
                  onChange={(e) => set("birthday", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="pf-location">Локация</label>
              <input
                id="pf-location"
                className={fieldCls}
                placeholder="Город, страна"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                maxLength={80}
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-muted)]">
              <span className="truncate">{me?.email}</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
            onClick={onClose}
          >
            Закрыть
          </button>
          <button
            onClick={save}
            disabled={saving}
            aria-busy={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
          >
            {saving && <span className="loading loading-spinner loading-sm" />}
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
