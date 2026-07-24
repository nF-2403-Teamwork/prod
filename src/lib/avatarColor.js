// Curated vibrant gradients for initial-letter avatars. A stable hash of the
// user (email/name) picks one, so each person keeps the same nice colour
// everywhere in the app.
export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#8b5cf6,#6366f1)", // violet → indigo
  "linear-gradient(135deg,#ec4899,#d946ef)", // pink → fuchsia
  "linear-gradient(135deg,#0ea5e9,#2563eb)", // sky → blue
  "linear-gradient(135deg,#10b981,#0d9488)", // emerald → teal
  "linear-gradient(135deg,#f59e0b,#ea580c)", // amber → orange
  "linear-gradient(135deg,#fb7185,#e11d48)", // rose
  "linear-gradient(135deg,#14b8a6,#0ea5e9)", // teal → sky
  "linear-gradient(135deg,#a855f7,#ec4899)", // purple → pink
  "linear-gradient(135deg,#6366f1,#06b6d4)", // indigo → cyan
  "linear-gradient(135deg,#e11d48,#9333ea)", // crimson → purple
  "linear-gradient(135deg,#3b82f6,#8b5cf6)", // blue → violet
  "linear-gradient(135deg,#f97316,#db2777)", // orange → pink
];

export function gradientFor(key) {
  const s = String(key || "").toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}
