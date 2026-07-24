import { useDispatch, useSelector } from "react-redux";

import {
  settingsOf,
  setMessageTextSize,
  setChatWallpaper,
  setAccent,
  setListDensity,
  resetAppearance,
} from "../../store/uiSlice";
import {
  ACCENTS,
  WALLPAPERS,
  DENSITIES,
  MIN_TEXT_SIZE,
  MAX_TEXT_SIZE,
  accentValue,
} from "./appearance";
import { useT } from "./i18n";
import { Group, Note, ToggleRow, ChoiceRow, Row } from "./primitives";
import { MoonIcon, SwapIcon } from "../icons";

// Live preview of the message size — mirrors the real bubble styling from
// Conversation.jsx so the slider shows exactly what the chat will look like.
function BubblePreview({ size, t }) {
  return (
    <div className="space-y-2 px-4 pb-3">
      <div className="flex justify-start">
        <span
          className="max-w-[80%] rounded-2xl rounded-bl-md border border-[var(--border)] px-4 py-2.5 leading-relaxed text-[var(--text)]"
          style={{ background: "var(--recv-bubble)", fontSize: `${size}px` }}
        >
          {t("appearance.sample")}
        </span>
      </div>
      <div className="flex justify-end">
        <span
          className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 leading-relaxed text-white"
          style={{
            background: "linear-gradient(120deg, #7c5cf5 0%, #9d78f2 100%)",
            fontSize: `${size}px`,
          }}
        >
          {t("appearance.sampleReply")}
        </span>
      </div>
    </div>
  );
}

export default function SectionAppearance({ dark, onToggleTheme }) {
  const dispatch = useDispatch();
  const s = useSelector((st) => settingsOf(st.ui));
  const [t, lang] = useT();

  return (
    <>
      <Group title={t("appearance.theme")}>
        <ToggleRow
          icon={<MoonIcon className="h-5 w-5" />}
          label={t("appearance.nightMode")}
          hint={t("appearance.nightModeHint")}
          checked={dark}
          onChange={onToggleTheme}
        />
      </Group>

      <Group title={t("appearance.textSize")}>
        <BubblePreview size={s.messageTextSize} t={t} />
        <div className="flex items-center gap-3 px-4 pb-4">
          <span className="text-[12px] text-[var(--text-muted)]">A</span>
          <input
            type="range"
            min={MIN_TEXT_SIZE}
            max={MAX_TEXT_SIZE}
            step={1}
            value={s.messageTextSize}
            onChange={(e) => dispatch(setMessageTextSize(e.target.value))}
            aria-label={t("appearance.textSize")}
            className="h-6 min-h-[44px] flex-1 cursor-pointer bg-transparent"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="text-[18px] text-[var(--text-muted)]">A</span>
          <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-[var(--text-strong)]">
            {s.messageTextSize}px
          </span>
        </div>
      </Group>
      <Note>{t("appearance.textSizeHint")}</Note>

      <Group title={t("appearance.accent")}>
        <div className="flex flex-wrap gap-2.5 px-4 py-4">
          {ACCENTS.map((a) => {
            const color = accentValue(a.id, s.theme);
            const active = s.accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => dispatch(setAccent(a.id))}
                aria-label={a[lang]}
                aria-pressed={active}
                title={a[lang]}
                className="flex h-11 w-11 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  background: color ?? "var(--accent)",
                  boxShadow: active
                    ? "0 0 0 2px var(--panel-bg), 0 0 0 4px var(--accent)"
                    : "inset 0 1px 1px rgba(255,255,255,.35)",
                  border: color ? "none" : "2px dashed var(--border)",
                }}
              />
            );
          })}
        </div>
      </Group>
      <Note>{t("appearance.accentHint")}</Note>

      <Group title={t("appearance.wallpaper")}>
        <div className="grid grid-cols-3 gap-2.5 px-4 py-4">
          {WALLPAPERS.map((w) => {
            const active = s.chatWallpaper === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => dispatch(setChatWallpaper(w.id))}
                aria-pressed={active}
                className="flex flex-col items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <span
                  className="block h-16 w-full rounded-xl border transition"
                  style={{
                    backgroundColor: "var(--recv-bubble)",
                    backgroundImage: w.css,
                    backgroundSize: w.size ?? "auto",
                    backgroundRepeat: w.size ? "repeat" : "no-repeat",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    boxShadow: active ? "0 0 0 2px var(--accent)" : "none",
                  }}
                />
                <span className="text-[11px] text-[var(--text-mid)]">{w[lang]}</span>
              </button>
            );
          })}
        </div>
      </Group>
      <Note>{t("appearance.wallpaperHint")}</Note>

      <Group title={t("appearance.density")}>
        {DENSITIES.map((d, i) => (
          <div key={d.id}>
            {i > 0 && <div className="ml-4 border-t border-[var(--border-soft)]" />}
            <ChoiceRow
              label={d[lang]}
              selected={s.listDensity === d.id}
              onSelect={() => dispatch(setListDensity(d.id))}
            />
          </div>
        ))}
      </Group>
      <Note>{t("appearance.densityHint")}</Note>

      <Group>
        <Row
          icon={<SwapIcon className="h-5 w-5" />}
          label={t("appearance.reset")}
          onClick={() => dispatch(resetAppearance())}
        />
      </Group>
    </>
  );
}
