import { useMemo } from "react";
import { useSelector } from "react-redux";

import { useT } from "./i18n";
import { Group, Note, StatLine, Row, Divider } from "./primitives";
import { LogOutIcon, BoltIcon } from "../icons";

// Best-effort UA sniffing. Only ever used to label the *current* browser, so a
// wrong guess is cosmetic — never a security decision.
function describeDevice() {
  const ua = navigator.userAgent;
  const browser =
    /Edg\//.test(ua) ? "Microsoft Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "—";
  const os =
    /Windows NT 10/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "—";
  return { browser, os, screen: `${window.screen.width}×${window.screen.height}` };
}

export default function SectionDevices({ onLogout }) {
  const me = useSelector((s) => s.auth.user);
  const [t] = useT();
  const d = useMemo(describeDevice, []);

  return (
    <>
      <Group title={t("devices.current")}>
        <StatLine label={t("devices.browser")} value={d.browser} />
        <Divider />
        <StatLine label={t("devices.os")} value={d.os} />
        <Divider />
        <StatLine label={t("devices.screen")} value={d.screen} />
        <Divider />
        <div className="flex min-h-[44px] items-center gap-3 px-4 py-2.5">
          <BoltIcon className="h-5 w-5 shrink-0" style={{ color: "var(--st-online)" }} />
          <span className="min-w-0 flex-1 text-[14px] text-[var(--text)]">
            {t("devices.session")}
          </span>
          <span className="truncate text-[12px] text-[var(--text-muted)]">{me?.email}</span>
        </div>
      </Group>

      <Group>
        <Row
          icon={<LogOutIcon className="h-5 w-5" />}
          label={t("devices.terminate")}
          danger
          onClick={onLogout}
        />
      </Group>

      <Note tone="warn">{t("devices.honest")}</Note>
    </>
  );
}
