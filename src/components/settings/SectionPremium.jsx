import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useWebSocket } from "../../context/WebSocketContext";
import { useT } from "./i18n";
import { Group, Note, StatLine, Divider, PURPLE_GRAD } from "./primitives";
import { StarIcon, CheckCircleIcon, GiftIcon, AlertIcon } from "../icons";

const dateOf = (ts, lang) =>
  ts ? new Date(ts).toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }) : "—";

export default function SectionPremium() {
  const { premiumPlans, buyPremium } = useWebSocket();
  const me = useSelector((s) => s.auth.user);
  const [t, lang] = useT();

  const [plans, setPlans] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    premiumPlans().then((p) => alive && setPlans(p));
    return () => {
      alive = false;
    };
  }, [premiumPlans]);

  const active = Boolean(me?.premium);

  const buy = async (id) => {
    setError("");
    setBusy(id);
    const res = await buyPremium(id);
    setBusy(null);
    if (!res?.ok) setError(res?.error || t("premium.error"));
  };

  return (
    <>
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-4"
        style={{ background: PURPLE_GRAD }}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
          <StarIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 text-white">
          <div className="text-[16px] font-semibold">
            {active ? t("premium.active") : t("premium.title")}
          </div>
          <div className="text-[12px] opacity-90">
            {active ? `${t("premium.until")} ${dateOf(me?.premiumUntil, lang)}` : t("premium.inactive")}
          </div>
        </div>
        {active && <CheckCircleIcon className="h-6 w-6 shrink-0 text-white" />}
      </div>

      {active && (
        <Group>
          <StatLine label={t("premium.plan")} value={me?.premiumPlan ?? "—"} />
          <Divider />
          <StatLine label={t("premium.until")} value={dateOf(me?.premiumUntil, lang)} />
        </Group>
      )}

      <Group title={t("premium.choose")}>
        {plans === null ? (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
            {t("premium.loading")}
          </p>
        ) : plans.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
            {t("premium.empty")}
          </p>
        ) : (
          plans.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Divider />}
              <div className="flex min-h-[44px] items-center gap-3 px-4 py-3">
                <span className="shrink-0 text-[var(--accent)]">
                  <GiftIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] text-[var(--text-strong)]">{p.title}</div>
                  <div className="text-[12px] text-[var(--text-muted)]">
                    {p.price} · {p.days} {lang === "en" ? "days" : "дн."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => buy(p.id)}
                  disabled={Boolean(busy)}
                  className="min-h-[44px] shrink-0 rounded-full px-4 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  style={{ background: PURPLE_GRAD }}
                >
                  {busy === p.id
                    ? t("premium.busy")
                    : active
                      ? t("premium.extend")
                      : t("premium.buy")}
                </button>
              </div>
            </div>
          ))
        )}
      </Group>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px]"
          style={{ background: "var(--st-danger-soft)", color: "var(--st-danger)" }}
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Group title={t("premium.perks")}>
        {["premium.perk1", "premium.perk2", "premium.perk3"].map((k, i) => (
          <div key={k}>
            {i > 0 && <Divider />}
            <div className="flex min-h-[44px] items-center gap-3 px-4 py-2.5">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
              <span className="text-[14px] text-[var(--text)]">{t(k)}</span>
            </div>
          </div>
        ))}
      </Group>

      <Note tone="warn">{t("premium.demo")}</Note>
    </>
  );
}
