// Real measurements of what this app actually keeps in localStorage. Everything
// here reads the live store — no estimates.

// localStorage counts UTF-16 code units, so a char is ~2 bytes.
const sizeOf = (str) => (str ? str.length * 2 : 0);

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Byte size of one slice inside the redux-persist blob. Each slice is stored as
// its own JSON string under "persist:root", so this is exact, not apportioned.
function sliceSizes() {
  const out = { avatars: 0, calls: 0, rooms: 0, counts: { avatars: 0, calls: 0, rooms: 0 } };
  try {
    const raw = localStorage.getItem("persist:root");
    if (!raw) return out;
    const root = JSON.parse(raw);
    const app = root.app ? JSON.parse(root.app) : null;
    if (!app) return out;

    const avatars = app.contactAvatars ?? {};
    out.avatars = sizeOf(JSON.stringify(avatars));
    out.counts.avatars = Object.keys(avatars).length;

    const calls = app.calls ?? [];
    out.calls = sizeOf(JSON.stringify(calls));
    out.counts.calls = calls.length;

    const rooms = [...(app.channels ?? []), ...(app.groups ?? [])];
    out.rooms = sizeOf(JSON.stringify(rooms));
    out.counts.rooms = rooms.length;
  } catch {
    // A corrupt blob shouldn't take the settings screen down.
  }
  return out;
}

export function storageStats() {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      total += sizeOf(key) + sizeOf(localStorage.getItem(key));
    }
  } catch {
    return { total: 0, avatars: 0, calls: 0, rooms: 0, other: 0, counts: {} };
  }
  const s = sliceSizes();
  return {
    total,
    avatars: s.avatars,
    calls: s.calls,
    rooms: s.rooms,
    other: Math.max(0, total - s.avatars - s.calls - s.rooms),
    counts: s.counts,
  };
}
