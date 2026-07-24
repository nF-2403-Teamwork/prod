import { store } from "../../store/store";
import { settingsOf } from "../../store/uiSlice";

// Appearance prefs have to apply app-wide, but SettingsPanel is unmounted
// whenever the slide-over closes — so this subscribes to the store directly
// rather than living in a component. ThemeApplier (main.jsx) is the natural
// host for this once that file is free to touch.

// Accent palette. Per-theme pairs because a single mid-tone can't stay legible
// as `--accent` on both the near-black and the cream surfaces.
export const ACCENTS = [
  { id: "default", ru: "Как в теме", en: "Theme default" },
  { id: "violet", ru: "Фиолетовый", en: "Violet", dark: "#a78bfa", light: "#7c3aed" },
  { id: "blue", ru: "Синий", en: "Blue", dark: "#60a5fa", light: "#2563eb" },
  { id: "teal", ru: "Бирюзовый", en: "Teal", dark: "#2dd4bf", light: "#0d9488" },
  { id: "green", ru: "Зелёный", en: "Green", dark: "#34d399", light: "#059669" },
  { id: "amber", ru: "Янтарный", en: "Amber", dark: "#fbbf24", light: "#b45309" },
  { id: "rose", ru: "Розовый", en: "Rose", dark: "#fb7185", light: "#e11d48" },
];

// Wallpapers are written against var(--accent) + color-mix so each one restyles
// itself with the theme and the chosen accent instead of shipping fixed colours.
const tint = (pct) => `color-mix(in srgb, var(--accent) ${pct}%, transparent)`;

export const WALLPAPERS = [
  { id: "none", ru: "Нет", en: "None", css: "none" },
  {
    id: "aurora",
    ru: "Аврора",
    en: "Aurora",
    css: `radial-gradient(620px circle at 12% 8%, ${tint(26)}, transparent 60%),
          radial-gradient(520px circle at 88% 18%, ${tint(18)}, transparent 60%),
          radial-gradient(680px circle at 60% 96%, ${tint(20)}, transparent 62%)`,
  },
  {
    id: "dots",
    ru: "Точки",
    en: "Dots",
    css: `radial-gradient(${tint(34)} 1.4px, transparent 1.5px)`,
    size: "18px 18px",
  },
  {
    id: "grid",
    ru: "Сетка",
    en: "Grid",
    css: `linear-gradient(${tint(16)} 1px, transparent 1px),
          linear-gradient(90deg, ${tint(16)} 1px, transparent 1px)`,
    size: "26px 26px",
  },
  {
    id: "stripes",
    ru: "Полосы",
    en: "Stripes",
    css: `repeating-linear-gradient(135deg, ${tint(12)} 0 2px, transparent 2px 14px)`,
  },
  {
    id: "glow",
    ru: "Сияние",
    en: "Glow",
    css: `radial-gradient(900px circle at 50% 0%, ${tint(22)}, transparent 55%)`,
  },
];

export const DENSITIES = [
  { id: "roomy", ru: "Просторно", en: "Roomy", pad: "8px" },
  { id: "compact", ru: "Компактно", en: "Compact", pad: "3px" },
];

export const MIN_TEXT_SIZE = 12;
export const MAX_TEXT_SIZE = 22;

export const accentValue = (id, theme) => {
  const a = ACCENTS.find((x) => x.id === id);
  if (!a || !a.dark) return null;
  return theme === "light" ? a.light : a.dark;
};

const wallpaperOf = (id) => WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];

// Static rules. These lean on selectors that already exist in the app:
//  - `.msg-in .break-words` — chat bubbles (Conversation.jsx)
//  - `[role="log"][aria-label="Сообщения"]` — the message scroller
//  - `nav[aria-label="Чаты"]` — the sidebar chat list
// Each wins on specificity over the Tailwind utility it overrides, so no
// !important is needed. They're the only way to reach those views without
// editing Conversation.jsx / ChatLayout.jsx.
const STATIC_RULES = `
.msg-in .break-words { font-size: var(--msg-size, 15px); }
input[aria-label="Сообщение"] { font-size: var(--msg-size, 15px); }
[role="log"][aria-label="Сообщения"] {
  background-image: var(--chat-wallpaper, none);
  background-size: var(--chat-wallpaper-size, auto);
  background-repeat: var(--chat-wallpaper-repeat, no-repeat);
}
nav[aria-label="Чаты"] a,
nav[aria-label="Чаты"] > button {
  padding-top: var(--list-row-pad, 8px);
  padding-bottom: var(--list-row-pad, 8px);
}
/* index.css ships no danger/online tokens and isn't ours to extend, so the
   settings surface defines its own here once instead of inlining hex in JSX. */
[data-theme="dark"] {
  --st-danger: #f87171;
  --st-danger-soft: rgba(248, 113, 113, 0.12);
  --st-online: #34d399;
}
[data-theme="light"] {
  --st-danger: #dc2626;
  --st-danger-soft: rgba(220, 38, 38, 0.09);
  --st-online: #059669;
}
`;

// ChatLayout re-declares every token on its own [data-theme] div, so an inline
// --accent on <html> would be shadowed inside the app. These rules carry enough
// specificity to win in both places.
const accentRules = () =>
  ACCENTS.filter((a) => a.dark)
    .map((a) =>
      ["dark", "light"]
        .map(
          (t) =>
            `html[data-accent="${a.id}"][data-theme="${t}"],
             html[data-accent="${a.id}"] [data-theme="${t}"] { --accent: ${t === "light" ? a.light : a.dark}; }`,
        )
        .join("\n"),
    )
    .join("\n");

let styleEl = null;

function ensureSheet() {
  if (styleEl || typeof document === "undefined") return;
  styleEl = document.createElement("style");
  styleEl.dataset.settings = "appearance";
  styleEl.textContent = STATIC_RULES + accentRules();
  document.head.appendChild(styleEl);
}

export function applyAppearance(ui) {
  if (typeof document === "undefined") return;
  ensureSheet();
  const s = settingsOf(ui);
  const root = document.documentElement;
  const wp = wallpaperOf(s.chatWallpaper);
  const density = DENSITIES.find((d) => d.id === s.listDensity) ?? DENSITIES[0];

  root.style.setProperty("--msg-size", `${s.messageTextSize}px`);
  root.style.setProperty("--chat-wallpaper", wp.css);
  root.style.setProperty("--chat-wallpaper-size", wp.size ?? "auto");
  root.style.setProperty("--chat-wallpaper-repeat", wp.size ? "repeat" : "no-repeat");
  root.style.setProperty("--list-row-pad", density.pad);

  if (accentValue(s.accent, s.theme)) root.dataset.accent = s.accent;
  else delete root.dataset.accent;

  root.lang = s.language;
}

let last;
function sync() {
  const ui = store.getState().ui;
  if (ui === last) return;
  last = ui;
  applyAppearance(ui);
}

sync();
store.subscribe(sync);
