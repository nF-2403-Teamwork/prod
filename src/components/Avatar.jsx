import { useSelector } from "react-redux";

import { firstLetterOf } from "../lib/format";
import { gradientFor } from "../lib/avatarColor";

// Square size classes — Tailwind needs them verbatim for JIT.
const SIZES = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};
const TEXT = { sm: "text-base", md: "text-lg", lg: "text-2xl", xl: "text-4xl" };

// User avatar: uploaded/override image when present, else a single-letter
// placeholder on a vibrant per-user gradient.
export default function Avatar({ user, size = "md", className = "" }) {
  const dim = SIZES[size] ?? SIZES.md;
  // Local per-contact photo override wins over their real avatar.
  const override = useSelector((s) =>
    user?.email ? s.app.contactAvatars?.[user.email] : null,
  );
  const src = override || user?.avatar;

  if (src) {
    return (
      <div className={`${dim} shrink-0 overflow-hidden rounded-full ${className}`}>
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${dim} flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${
        TEXT[size] ?? "text-lg"
      } ${className}`}
      style={{
        background: gradientFor(user?.email || firstLetterOf(user)),
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,.4), inset 0 -8px 14px rgba(0,0,0,.14)",
      }}
    >
      {firstLetterOf(user)}
    </div>
  );
}
