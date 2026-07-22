import { createSlice } from "@reduxjs/toolkit";

// UI preferences that outlive a session (persisted to localStorage).
//
// Deliberately FLAT: redux-persist reconciles with autoMergeLevel1, which
// replaces this slice wholesale with whatever was stored. A build that only
// ever persisted `{ theme }` therefore rehydrates without any of the keys added
// later, and nested objects would come back half-missing. Flat keys + reading
// through `settingsOf` means an old blob just falls back to the defaults.
export const SETTINGS_DEFAULTS = {
  theme: "dark", // "light" | "dark" — signature look is dark; light is opt-in

  // Оформление
  messageTextSize: 15, // px, applied to chat bubbles
  chatWallpaper: "none",
  accent: "default",
  listDensity: "roomy", // "roomy" | "compact"

  // Уведомления и звуки
  notifyPrivate: true,
  notifyGroups: true,
  notifyChannels: true,
  notifySounds: true,
  notifyPreview: true,

  // Приватность — local-only, the server does not enforce any of this yet
  privacyLastSeen: "everybody", // "everybody" | "contacts" | "nobody"
  privacyCalls: "everybody",
  privacyGroupAdd: "everybody",
  blockedUsers: [], // emails

  language: "ru", // "ru" | "en"

  // Данные и хранилище
  autoDownloadPhotos: true,
  autoDownloadVoice: true,
  autoDownloadVideo: false,
  autoDownloadFiles: false,
};

// Read helper — always use this instead of touching `state.ui` directly, so a
// slice rehydrated from an older build still yields every key.
export const settingsOf = (ui) => ({ ...SETTINGS_DEFAULTS, ...ui });

const MIN_TEXT_SIZE = 12;
const MAX_TEXT_SIZE = 22;

const AUDIENCES = ["everybody", "contacts", "nobody"];
const NOTIFY_KEYS = [
  "notifyPrivate",
  "notifyGroups",
  "notifyChannels",
  "notifySounds",
  "notifyPreview",
];
const AUTO_DOWNLOAD_KEYS = [
  "autoDownloadPhotos",
  "autoDownloadVoice",
  "autoDownloadVideo",
  "autoDownloadFiles",
];
const PRIVACY_KEYS = ["privacyLastSeen", "privacyCalls", "privacyGroupAdd"];

const uiSlice = createSlice({
  name: "ui",
  initialState: SETTINGS_DEFAULTS,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload === "dark" ? "dark" : "light";
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },

    setMessageTextSize: (state, action) => {
      const px = Number(action.payload);
      if (!Number.isFinite(px)) return;
      state.messageTextSize = Math.min(MAX_TEXT_SIZE, Math.max(MIN_TEXT_SIZE, Math.round(px)));
    },
    setChatWallpaper: (state, action) => {
      state.chatWallpaper = String(action.payload);
    },
    setAccent: (state, action) => {
      state.accent = String(action.payload);
    },
    setListDensity: (state, action) => {
      state.listDensity = action.payload === "compact" ? "compact" : "roomy";
    },
    resetAppearance: (state) => {
      state.messageTextSize = SETTINGS_DEFAULTS.messageTextSize;
      state.chatWallpaper = SETTINGS_DEFAULTS.chatWallpaper;
      state.accent = SETTINGS_DEFAULTS.accent;
      state.listDensity = SETTINGS_DEFAULTS.listDensity;
    },

    setNotifyPref: (state, action) => {
      const { key, value } = action.payload ?? {};
      if (NOTIFY_KEYS.includes(key)) state[key] = Boolean(value);
    },

    setPrivacyPref: (state, action) => {
      const { key, value } = action.payload ?? {};
      if (PRIVACY_KEYS.includes(key) && AUDIENCES.includes(value)) state[key] = value;
    },
    blockUser: (state, action) => {
      const email = String(action.payload || "").toLowerCase();
      if (!email) return;
      if (!Array.isArray(state.blockedUsers)) state.blockedUsers = [];
      if (!state.blockedUsers.includes(email)) state.blockedUsers.push(email);
    },
    unblockUser: (state, action) => {
      if (!Array.isArray(state.blockedUsers)) {
        state.blockedUsers = [];
        return;
      }
      const email = String(action.payload || "").toLowerCase();
      state.blockedUsers = state.blockedUsers.filter((e) => e !== email);
    },

    setLanguage: (state, action) => {
      state.language = action.payload === "en" ? "en" : "ru";
    },

    setAutoDownload: (state, action) => {
      const { key, value } = action.payload ?? {};
      if (AUTO_DOWNLOAD_KEYS.includes(key)) state[key] = Boolean(value);
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setMessageTextSize,
  setChatWallpaper,
  setAccent,
  setListDensity,
  resetAppearance,
  setNotifyPref,
  setPrivacyPref,
  blockUser,
  unblockUser,
  setLanguage,
  setAutoDownload,
} = uiSlice.actions;
export default uiSlice.reducer;
