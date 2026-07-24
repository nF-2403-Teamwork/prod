import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { settingsOf, setPrivacyPref, blockUser, unblockUser } from "../../store/uiSlice";
import { useWebSocket } from "../../context/WebSocketContext";
import { nameOf } from "../../lib/format";
import Avatar from "../Avatar";
import { useT } from "./i18n";
import { Group, Note, NavRow, ChoiceRow, Row, Divider } from "./primitives";
import { EyeIcon, PhoneIcon, UsersIcon, LockIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from "../icons";

const AUDIENCES = ["everybody", "contacts", "nobody"];

const RULES = [
  { key: "privacyLastSeen", labelKey: "privacy.lastSeen", icon: EyeIcon },
  { key: "privacyCalls", labelKey: "privacy.calls", icon: PhoneIcon },
  { key: "privacyGroupAdd", labelKey: "privacy.groupAdd", icon: UsersIcon },
];

function AudiencePicker({ rule, value, onPick, onBack, t }) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 flex min-h-[44px] items-center gap-2 px-2 text-[14px] text-[var(--accent)] transition hover:opacity-80"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t("app.back")}
      </button>
      <Group title={t(rule.labelKey)}>
        {AUDIENCES.map((a, i) => (
          <div key={a}>
            {i > 0 && <div className="ml-4 border-t border-[var(--border-soft)]" />}
            <ChoiceRow
              label={t(`privacy.${a}`)}
              selected={value === a}
              onSelect={() => onPick(a)}
            />
          </div>
        ))}
      </Group>
      <Note tone="warn">{t("privacy.honest")}</Note>
    </>
  );
}

function BlockedList({ blocked, contacts, onBlock, onUnblock, onBack, t }) {
  const [adding, setAdding] = useState(false);
  const candidates = contacts.filter((c) => !blocked.includes(c.email));

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 flex min-h-[44px] items-center gap-2 px-2 text-[14px] text-[var(--accent)] transition hover:opacity-80"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t("app.back")}
      </button>

      <Group title={`${t("privacy.blockedCount")}: ${blocked.length}`}>
        {blocked.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
            {t("privacy.blockedEmpty")}
          </p>
        ) : (
          blocked.map((email, i) => {
            const c = contacts.find((x) => x.email === email);
            return (
              <div key={email}>
                {i > 0 && <Divider />}
                <div className="flex min-h-[44px] items-center gap-3 px-4 py-2.5">
                  <Avatar user={c ?? { email }} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-[var(--text-strong)]">
                      {c ? nameOf(c) : email}
                    </div>
                    <div className="truncate text-[12px] text-[var(--text-muted)]">{email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnblock(email)}
                    aria-label={`${t("privacy.unblock")} ${email}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[var(--surface-hover)]"
                    style={{ color: "var(--st-danger)" }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Group>

      {adding ? (
        <Group title={t("privacy.blockedAdd")}>
          {candidates.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">—</p>
          ) : (
            candidates.map((c, i) => (
              <div key={c.email}>
                {i > 0 && <Divider />}
                <button
                  type="button"
                  onClick={() => {
                    onBlock(c.email);
                    setAdding(false);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--surface-hover)]"
                >
                  <Avatar user={c} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-[var(--text-strong)]">{nameOf(c)}</div>
                    <div className="truncate text-[12px] text-[var(--text-muted)]">{c.email}</div>
                  </div>
                </button>
              </div>
            ))
          )}
        </Group>
      ) : (
        <Group>
          <Row
            icon={<PlusIcon className="h-5 w-5" />}
            label={t("privacy.blockedAdd")}
            onClick={() => setAdding(true)}
          />
        </Group>
      )}

      <Note tone="warn">{t("privacy.blockedHonest")}</Note>
    </>
  );
}

export default function SectionPrivacy() {
  const dispatch = useDispatch();
  const s = useSelector((st) => settingsOf(st.ui));
  const { contacts } = useWebSocket();
  const [t] = useT();
  const [view, setView] = useState(null); // null | rule key | "blocked"

  const blocked = Array.isArray(s.blockedUsers) ? s.blockedUsers : [];

  if (view === "blocked") {
    return (
      <BlockedList
        blocked={blocked}
        contacts={contacts}
        onBlock={(e) => dispatch(blockUser(e))}
        onUnblock={(e) => dispatch(unblockUser(e))}
        onBack={() => setView(null)}
        t={t}
      />
    );
  }

  const rule = RULES.find((r) => r.key === view);
  if (rule) {
    return (
      <AudiencePicker
        rule={rule}
        value={s[rule.key]}
        onPick={(v) => dispatch(setPrivacyPref({ key: rule.key, value: v }))}
        onBack={() => setView(null)}
        t={t}
      />
    );
  }

  return (
    <>
      <Group>
        {RULES.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={r.key}>
              {i > 0 && <Divider />}
              <NavRow
                icon={<Icon className="h-5 w-5" />}
                label={t(r.labelKey)}
                badge={t(`privacy.${s[r.key]}`)}
                onClick={() => setView(r.key)}
              />
            </div>
          );
        })}
      </Group>

      <Group>
        <NavRow
          icon={<LockIcon className="h-5 w-5" />}
          label={t("privacy.blocked")}
          badge={String(blocked.length)}
          onClick={() => setView("blocked")}
        />
      </Group>

      <Note tone="warn">{t("privacy.honest")}</Note>
    </>
  );
}
