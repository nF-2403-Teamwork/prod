// Emojis here are message *content* (stickers the user inserts), not UI icons —
// the trigger button uses an SVG icon. A fixed set keeps it dependency-free.
const EMOJIS = [
  "😀", "😂", "😍", "😎", "🥳", "😇",
  "😉", "😭", "😡", "🤔", "😴", "😅",
  "👍", "👎", "🙏", "👏", "💪", "🤝",
  "🔥", "🎉", "❤️", "💯", "✨", "🚀",
  "☕", "🍕", "🎁", "🌟", "👋", "🙌",
];

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <>
      {/* Click-away overlay */}
      <button
        type="button"
        className="fixed inset-0 z-10 cursor-default"
        onClick={onClose}
        aria-label="Close emoji picker"
        tabIndex={-1}
      />
      <div
        className="so-pop absolute bottom-full left-2 z-20 mb-2 grid max-h-48 w-64 grid-cols-6 gap-1 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
        role="menu"
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="rounded-lg p-1.5 text-xl leading-none transition-all duration-150 hover:scale-110 hover:bg-base-200 active:scale-95"
            aria-label={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
