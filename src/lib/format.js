// Small presentation helpers shared by the chat list and the conversation view.

// Preferred display label: explicit display name, else "First Last",
// else @username, else the email local part.
export const nameOf = (u) => {
  if (!u) return "";
  const dn = u.displayName?.trim();
  if (dn) return dn;
  const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  if (full) return full;
  if (u.username) return `@${u.username}`;
  return u.email?.split("@")[0] ?? "";
};

export const initialsOf = (c) => {
  const name = nameOf(c);
  const parts = name.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.slice(0, 2) ?? "";
  return chars.toUpperCase() || "?";
};

// Single leading letter for avatar placeholders.
export const firstLetterOf = (c) => {
  const name = nameOf(c).replace(/^@/, "").trim();
  return (name[0] || "?").toUpperCase();
};

export const clockTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Compact timestamp for the chat list: time today, "вчера", else a short date.
export function shortTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return clockTime(ts);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "вчера";
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

export function lastSeenText(lastSeen) {
  if (!lastSeen) return "не в сети";
  const min = Math.floor((Date.now() - lastSeen) / 60000);
  if (min < 1) return "был(а) только что";
  if (min < 60) return `был(а) ${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `был(а) ${hr} ч назад`;
  return `был(а) ${Math.floor(hr / 24)} дн назад`;
}

// One-line preview of the last message for the chat list.
export function previewText(msg, myEmail) {
  if (!msg) return "";
  const prefix = msg.from === myEmail ? "Вы: " : "";
  if (msg.kind === "image") return `${prefix}📷 Фото`;
  if (msg.kind === "voice") return `${prefix}🎤 Голосовое`;
  if (msg.kind === "video") return `${prefix}🎥 Видео`;
  if (msg.kind === "file") return `${prefix}📎 Файл`;
  return prefix + (msg.text || "");
}
