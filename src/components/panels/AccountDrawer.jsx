import { useState } from "react";
import { useSelector } from "react-redux";

import Avatar from "../Avatar";
import { nameOf } from "../../lib/format";
import {
  XIcon,
  UserIcon,
  UsersIcon,
  MegaphoneIcon,
  PhoneIcon,
  BookmarkIcon,
  SettingsIcon,
  MoonIcon,
  LogOutIcon,
  ChevronRightIcon,
  VerifiedIcon,
  PlusIcon,
  CheckIcon,
  AlertIcon,
} from "../icons";

const PURPLE_GRAD = "linear-gradient(120deg, #8b5cf6 0%, #a78bfa 100%)";

// One drawer entry. min-h-[44px] keeps the row at the platform touch-target
// floor even though the label is a single line.
function DrawerRow({ icon, label, badge = 0, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="so-row flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--text)] transition-colors duration-200 hover:bg-[var(--surface-hover)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span className="shrink-0 text-[var(--text-mid)]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span
          className="rounded-full px-1.5 text-[11px] font-bold text-white"
          style={{ background: "#ff5d6c" }}
        >
          {badge}
        </span>
      )}
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />
    </button>
  );
}

// One stored account. Switching to it reuses its saved token, so the row never
// leads to a password prompt.
function AccountSwitchRow({ account, active, busy, disabled, onClick, style }) {
  const u = account.user;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active}
      style={style}
      className="so-row flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-200 hover:bg-[var(--surface-hover)] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <Avatar user={u} size="sm" tone="primary" className="rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--text)]">{nameOf(u)}</div>
        <div className="truncate text-xs text-[var(--text-muted)]">
          {u?.username ? `@${u.username}` : u?.email}
        </div>
      </div>
      {busy ? (
        <span className="loading loading-spinner loading-xs shrink-0 text-[var(--text-mid)]" />
      ) : active ? (
        <CheckIcon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
      ) : null}
    </button>
  );
}

// Right-anchored account drawer, opened from "Account" in the sidebar. Routes
// every entry back to the panels ChatLayout already owns via `onSelect`.
export default function AccountDrawer({
  onClose,
  onSelect,
  dark,
  onToggleTheme,
  onLogout,
  onAddAccount,
  onSwitchAccount,
}) {
  const me = useSelector((s) => s.auth.user);
  const accounts = useSelector((s) => s.accounts.list);
  const activeEmail = useSelector((s) => s.accounts.activeEmail);
  const [switching, setSwitching] = useState(null); // email being switched to
  const [switchError, setSwitchError] = useState("");

  const switchTo = async (email) => {
    if (email === activeEmail || switching) return;
    setSwitchError("");
    setSwitching(email);
    const res = await onSwitchAccount(email);
    setSwitching(null);
    if (!res?.ok) setSwitchError(res?.error || "Не удалось переключить аккаунт");
  };

  const items = [
    { key: "profile", label: "My Profile", icon: <UserIcon className="h-5 w-5" /> },
    { key: "group", label: "Создать группу", icon: <UsersIcon className="h-5 w-5" /> },
    { key: "channel", label: "Создать канал", icon: <MegaphoneIcon className="h-5 w-5" /> },
    { key: "calls", label: "Звонки", icon: <PhoneIcon className="h-5 w-5" /> },
    { key: "saved", label: "Избранное", icon: <BookmarkIcon className="h-5 w-5" /> },
    { key: "settings", label: "Настройки", icon: <SettingsIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">Account</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Account card — tapping it jumps straight to the profile panel */}
      <button
        type="button"
        onClick={() => onSelect("profile")}
        className="so-pop mx-3 mb-2 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-[0.99]"
      >
        <Avatar
          user={me}
          size="md"
          tone="primary"
          className="rounded-full ring-2 ring-[var(--ring)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate font-semibold text-[var(--text)]">{nameOf(me)}</span>
            {me?.verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />}
          </div>
          <div className="truncate text-xs text-[var(--text-muted)]">
            {me?.username ? `@${me.username}` : me?.email}
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />
      </button>

      {/* Locally stored accounts — switching reuses the saved session token */}
      <div className="space-y-0.5 border-b border-[var(--border)] px-3 pb-2">
        {switchError && (
          <div
            role="alert"
            className="mb-1 flex items-start gap-2 rounded-xl border border-[#ff5d6c]/30 bg-[#ff5d6c]/10 px-3 py-2 text-xs text-[#f87171]"
          >
            <AlertIcon className="h-4 w-4 shrink-0" />
            <span>{switchError}</span>
          </div>
        )}
        {accounts.map((a, i) => (
          <AccountSwitchRow
            key={a.user.email}
            account={a}
            active={a.user.email === activeEmail}
            busy={switching === a.user.email}
            disabled={Boolean(switching)}
            onClick={() => switchTo(a.user.email)}
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
        <button
          type="button"
          onClick={onAddAccount}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--accent)] transition-colors duration-200 hover:bg-[var(--surface-hover)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
            <PlusIcon className="h-4 w-4" />
          </span>
          Добавить аккаунт
        </button>
      </div>

      <div className="so-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pt-2 pb-2">
        {items.map((m, i) => (
          <DrawerRow
            key={m.key}
            icon={m.icon}
            label={m.label}
            onClick={() => onSelect(m.key)}
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
      </div>

      {/* Night mode + logout, kept apart from the navigation entries above */}
      <div className="space-y-1 border-t border-[var(--border)] px-3 py-2">
        <div className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2">
          <span className="flex items-center gap-3 text-sm text-[var(--text)]">
            <MoonIcon className="h-5 w-5 text-[var(--text-mid)]" />
            Ночной режим
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            onClick={onToggleTheme}
            className="relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 active:scale-95"
            style={{ background: dark ? PURPLE_GRAD : "var(--switch-off)" }}
            aria-label="Ночной режим"
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              style={{ left: dark ? "22px" : "2px" }}
            />
          </button>
        </div>
        <button
          onClick={onLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#f87171] transition-colors duration-200 hover:bg-[#ff5d6c]/10 active:scale-[0.99]"
        >
          <LogOutIcon className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </div>
  );
}
