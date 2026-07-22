import { useState } from "react";
import { useSelector } from "react-redux";

import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import { settingsOf } from "../../store/uiSlice";
// Side-effect import: installs the app-wide appearance applier (see appearance.js).
import "../settings/appearance";
import { useT } from "../settings/i18n";
import { Group, Note, NavRow, Row, Divider } from "../settings/primitives";
import SectionAppearance from "../settings/SectionAppearance";
import SectionNotifications from "../settings/SectionNotifications";
import SectionPrivacy from "../settings/SectionPrivacy";
import SectionLanguage from "../settings/SectionLanguage";
import SectionStorage from "../settings/SectionStorage";
import SectionPremium from "../settings/SectionPremium";
import SectionDevices from "../settings/SectionDevices";
import {
  XIcon,
  UserIcon,
  ArrowLeftIcon,
  VerifiedIcon,
  StarIcon,
  BellIcon,
  LockIcon,
  MoonIcon,
  MailIcon,
  PhoneIcon,
  QrIcon,
  LogOutIcon,
  BookmarkIcon,
  SettingsIcon,
} from "../icons";

const SECTIONS = {
  premium: { titleKey: "root.premium", Component: SectionPremium },
  appearance: { titleKey: "root.appearance", Component: SectionAppearance },
  notifications: { titleKey: "root.notifications", Component: SectionNotifications },
  privacy: { titleKey: "root.privacy", Component: SectionPrivacy },
  language: { titleKey: "root.language", Component: SectionLanguage },
  storage: { titleKey: "root.storage", Component: SectionStorage },
  devices: { titleKey: "root.devices", Component: SectionDevices },
};

// Header card: avatar, name, @username and the contact lines Telegram shows.
function AccountCard({ me, onEditProfile, t }) {
  return (
    <button
      type="button"
      onClick={onEditProfile}
      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left transition hover:bg-[var(--surface-3)]"
    >
      <Avatar user={me} size="lg" className="ring-2 ring-[var(--ring)]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-[17px] font-semibold text-[var(--text-strong)]">
            {nameOf(me)}
          </span>
          {me?.verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />}
          {me?.premium && <StarIcon className="h-4 w-4 shrink-0 text-[var(--accent)]" />}
        </div>
        <div className="truncate text-[13px] text-[var(--text-muted)]">
          {me?.username ? `@${me.username}` : t("profile.noUsername")}
        </div>
        {me?.description && (
          <div className="mt-0.5 truncate text-[12px] text-[var(--text-faint)]">
            {me.description}
          </div>
        )}
      </div>
    </button>
  );
}

// Settings hub — a Telegram-style root list that drills into sections. The
// prop contract is fixed by ChatLayout, which owns the slide-over.
export default function SettingsPanel({
  onClose,
  onEditProfile,
  dark,
  onToggleTheme,
  onLogout,
}) {
  const me = useSelector((s) => s.auth.user);
  const blockedCount = useSelector((s) => settingsOf(s.ui).blockedUsers?.length ?? 0);
  const [t] = useT();
  const [section, setSection] = useState(null);

  const current = section ? SECTIONS[section] : null;
  const Section = current?.Component;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 px-3 pb-2 pt-4">
        {current && (
          <button
            type="button"
            onClick={() => setSection(null)}
            className="so-pop rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
            aria-label={t("app.back")}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <h2 className="flex-1 truncate px-1 text-xl font-semibold text-[var(--text-strong)]">
          {current ? t(current.titleKey) : t("app.title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
          aria-label={t("app.close")}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* key remounts the block on drill-in/out so each screen pops in smoothly */}
      <div key={section ?? "root"} className="so-pop so-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {Section ? (
          <Section dark={dark} onToggleTheme={onToggleTheme} onLogout={onLogout} />
        ) : (
          <>
            <div className="pt-1">
              <AccountCard me={me} onEditProfile={onEditProfile} t={t} />
            </div>

            <Group>
              <Row
                icon={<MailIcon className="h-5 w-5" />}
                label={me?.email ?? "—"}
                hint="Email"
                as="div"
              />
              <Divider />
              <Row
                icon={<PhoneIcon className="h-5 w-5" />}
                label={me?.phone || t("profile.phone")}
                hint={t("root.editProfile")}
                onClick={onEditProfile}
              />
              <Divider />
              <Row
                icon={<QrIcon className="h-5 w-5" />}
                label={me?.username ? `@${me.username}` : t("profile.noUsername")}
                hint="Username"
                onClick={onEditProfile}
              />
            </Group>

            <Group>
              <NavRow
                icon={<UserIcon className="h-5 w-5" />}
                label={t("root.editProfile")}
                onClick={onEditProfile}
              />
              <Divider />
              <NavRow
                icon={<StarIcon className="h-5 w-5" />}
                label={t("root.premium")}
                badge={me?.premium ? t("root.premiumActive") : t("root.premiumOff")}
                onClick={() => setSection("premium")}
              />
            </Group>

            <Group>
              <NavRow
                icon={<MoonIcon className="h-5 w-5" />}
                label={t("root.appearance")}
                onClick={() => setSection("appearance")}
              />
              <Divider />
              <NavRow
                icon={<BellIcon className="h-5 w-5" />}
                label={t("root.notifications")}
                onClick={() => setSection("notifications")}
              />
              <Divider />
              <NavRow
                icon={<LockIcon className="h-5 w-5" />}
                label={t("root.privacy")}
                badge={blockedCount > 0 ? String(blockedCount) : undefined}
                onClick={() => setSection("privacy")}
              />
              <Divider />
              <NavRow
                icon={<BookmarkIcon className="h-5 w-5" />}
                label={t("root.storage")}
                onClick={() => setSection("storage")}
              />
              <Divider />
              <NavRow
                icon={<SettingsIcon className="h-5 w-5" />}
                label={t("root.language")}
                badge={t("lang.title") === "Язык" ? "Русский" : "English"}
                onClick={() => setSection("language")}
              />
              <Divider />
              <NavRow
                icon={<PhoneIcon className="h-5 w-5" />}
                label={t("root.devices")}
                onClick={() => setSection("devices")}
              />
            </Group>

            {/* Sign-out is destructive — kept in its own block, away from navigation. */}
            <Group className="mt-6">
              <Row
                icon={<LogOutIcon className="h-5 w-5" />}
                label={t("root.logout")}
                hint={t("root.logoutHint")}
                danger
                onClick={onLogout}
              />
            </Group>

            <Note>{t("root.version")}</Note>
          </>
        )}
      </div>
    </div>
  );
}
