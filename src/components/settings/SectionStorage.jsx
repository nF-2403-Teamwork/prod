import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { settingsOf, setAutoDownload } from "../../store/uiSlice";
import { clearCalls, clearContactAvatar } from "../../store/appSlice";
import { storageStats, formatBytes } from "./storage";
import { useT } from "./i18n";
import { Group, Note, ToggleRow, Row, StatLine, Divider } from "./primitives";
import { CameraIcon, MicIcon, VideoIcon, PaperclipIcon, TrashIcon, AlertIcon } from "../icons";

const AUTO = [
  { key: "autoDownloadPhotos", labelKey: "storage.photos", icon: CameraIcon },
  { key: "autoDownloadVoice", labelKey: "storage.voice", icon: MicIcon },
  { key: "autoDownloadVideo", labelKey: "storage.video", icon: VideoIcon },
  { key: "autoDownloadFiles", labelKey: "storage.files", icon: PaperclipIcon },
];

export default function SectionStorage() {
  const dispatch = useDispatch();
  const s = useSelector((st) => settingsOf(st.ui));
  const avatars = useSelector((st) => st.app.contactAvatars ?? {});
  const calls = useSelector((st) => st.app.calls ?? []);
  const [t] = useT();

  const [stats, setStats] = useState(() => storageStats());
  const [confirming, setConfirming] = useState(false);
  const [freed, setFreed] = useState(null);

  // redux-persist writes asynchronously, so re-measure a tick after the store
  // changes rather than trusting the pre-write snapshot.
  const refresh = useCallback(() => {
    const id = setTimeout(() => setStats(storageStats()), 120);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => refresh(), [avatars, calls, refresh]);

  const nothingToClear = stats.avatars + stats.calls === 0;

  const clearCache = () => {
    const before = storageStats().total;
    Object.keys(avatars).forEach((email) => dispatch(clearContactAvatar(email)));
    dispatch(clearCalls());
    setConfirming(false);
    // Measured against the real blob once persist has flushed.
    setTimeout(() => {
      const after = storageStats();
      setStats(after);
      setFreed(Math.max(0, before - after.total));
    }, 200);
  };

  return (
    <>
      <Group title={t("storage.usage")}>
        <StatLine label={t("storage.total")} value={formatBytes(stats.total)} />
        <Divider />
        <StatLine
          label={`${t("storage.avatars")} · ${stats.counts.avatars ?? 0}`}
          value={formatBytes(stats.avatars)}
          muted
        />
        <StatLine
          label={`${t("storage.calls")} · ${stats.counts.calls ?? 0}`}
          value={formatBytes(stats.calls)}
          muted
        />
        <StatLine
          label={`${t("storage.groups")} · ${stats.counts.rooms ?? 0}`}
          value={formatBytes(stats.rooms)}
          muted
        />
        <StatLine label={t("storage.other")} value={formatBytes(stats.other)} muted />
      </Group>

      <Group>
        {confirming ? (
          <div className="flex flex-col gap-2 px-4 py-3">
            <span className="flex items-center gap-2 text-[14px] text-[var(--text-strong)]">
              <AlertIcon className="h-4 w-4" style={{ color: "var(--st-danger)" }} />
              {t("storage.clearConfirm")}
            </span>
            <span className="text-[12px] text-[var(--text-muted)]">{t("storage.clearHint")}</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={clearCache}
                className="min-h-[44px] flex-1 rounded-xl px-3 text-[14px] font-semibold text-white transition hover:brightness-110"
                style={{ background: "var(--st-danger)" }}
              >
                {t("storage.clearYes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] px-3 text-[14px] text-[var(--text)] transition hover:bg-[var(--surface-hover)]"
              >
                {t("app.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <Row
            icon={<TrashIcon className="h-5 w-5" />}
            label={t("storage.clear")}
            hint={nothingToClear ? t("storage.nothing") : t("storage.clearHint")}
            danger={!nothingToClear}
            onClick={() => !nothingToClear && setConfirming(true)}
            right={
              freed !== null ? (
                <span className="shrink-0 text-[12px] text-[var(--accent)]">
                  {t("storage.cleared")} {formatBytes(freed)}
                </span>
              ) : null
            }
          />
        )}
      </Group>
      <Note>{t("storage.cacheHonest")}</Note>

      <Group title={t("storage.autoDownload")}>
        {AUTO.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={a.key}>
              {i > 0 && <Divider />}
              <ToggleRow
                icon={<Icon className="h-5 w-5" />}
                label={t(a.labelKey)}
                checked={s[a.key]}
                onChange={(v) => dispatch(setAutoDownload({ key: a.key, value: v }))}
              />
            </div>
          );
        })}
      </Group>
      <Note tone="warn">{t("storage.autoHonest")}</Note>
    </>
  );
}
