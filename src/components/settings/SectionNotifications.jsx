import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { settingsOf, setNotifyPref } from "../../store/uiSlice";
import { playPing } from "./sounds";
import { useT } from "./i18n";
import { Group, Note, ToggleRow, Row, Divider } from "./primitives";
import {
  ChatBubbleIcon,
  UsersIcon,
  MegaphoneIcon,
  BellIcon,
  EyeIcon,
  PlayIcon,
  CheckIcon,
} from "../icons";

export default function SectionNotifications() {
  const dispatch = useDispatch();
  const s = useSelector((st) => settingsOf(st.ui));
  const [t] = useT();
  const [played, setPlayed] = useState(false);

  const set = (key) => (value) => dispatch(setNotifyPref({ key, value }));

  const test = () => {
    if (!s.notifySounds) return;
    const ok = playPing();
    setPlayed(ok);
    if (ok) setTimeout(() => setPlayed(false), 900);
  };

  return (
    <>
      <Group title={t("notif.chats")}>
        <ToggleRow
          icon={<ChatBubbleIcon className="h-5 w-5" />}
          label={t("notif.private")}
          checked={s.notifyPrivate}
          onChange={set("notifyPrivate")}
        />
        <Divider />
        <ToggleRow
          icon={<UsersIcon className="h-5 w-5" />}
          label={t("notif.groups")}
          checked={s.notifyGroups}
          onChange={set("notifyGroups")}
        />
        <Divider />
        <ToggleRow
          icon={<MegaphoneIcon className="h-5 w-5" />}
          label={t("notif.channels")}
          checked={s.notifyChannels}
          onChange={set("notifyChannels")}
        />
      </Group>

      <Group title={t("notif.sound")}>
        <ToggleRow
          icon={<BellIcon className="h-5 w-5" />}
          label={t("notif.inAppSounds")}
          hint={t("notif.inAppSoundsHint")}
          checked={s.notifySounds}
          onChange={set("notifySounds")}
        />
        <Divider />
        <ToggleRow
          icon={<EyeIcon className="h-5 w-5" />}
          label={t("notif.preview")}
          hint={t("notif.previewHint")}
          checked={s.notifyPreview}
          onChange={set("notifyPreview")}
        />
        <Divider />
        <Row
          icon={<PlayIcon className="h-5 w-5" />}
          label={t("notif.test")}
          hint={s.notifySounds ? t("notif.testHint") : t("notif.testOff")}
          onClick={test}
          right={played ? <CheckIcon className="h-5 w-5 shrink-0 text-[var(--accent)]" /> : null}
        />
      </Group>

      <Note tone="warn">{t("notif.honest")}</Note>
    </>
  );
}
