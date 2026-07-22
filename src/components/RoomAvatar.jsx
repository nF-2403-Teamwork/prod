import { UsersIcon, MegaphoneIcon } from "./icons";

// Square size classes — Tailwind needs them verbatim for JIT.
const SIZES = { sm: "h-9 w-9", md: "h-12 w-12", lg: "h-16 w-16", xl: "h-24 w-24" };
const GLYPH = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7", xl: "h-9 w-9" };

const GROUP_GRAD = "linear-gradient(135deg,#8b5cf6,#6366f1)";
const CHANNEL_GRAD = "linear-gradient(135deg,#38bdf8,#6366f1)";

// Room avatar: uploaded photo when present, else the kind glyph on a gradient
// (groups purple, channels blue) so the two read apart at a glance.
export default function RoomAvatar({ room, size = "md", className = "" }) {
  const dim = SIZES[size] ?? SIZES.md;

  if (room?.avatar) {
    return (
      <div className={`${dim} shrink-0 overflow-hidden rounded-full ${className}`}>
        <img src={room.avatar} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  const channel = room?.kind === "channel";
  const Glyph = channel ? MegaphoneIcon : UsersIcon;
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full text-white ${className}`}
      style={{
        background: channel ? CHANNEL_GRAD : GROUP_GRAD,
        boxShadow: "inset 0 1px 1px rgba(255,255,255,.4), inset 0 -8px 14px rgba(0,0,0,.14)",
      }}
    >
      <Glyph className={GLYPH[size] ?? GLYPH.md} />
    </div>
  );
}
