import { useState } from "react";
import { XIcon, GiftIcon } from "./icons";

const PURPLE_GRAD = "linear-gradient(120deg, #8b5cf6 0%, #a78bfa 100%)";

// Every gift is an emoji + name; they ship over the message tunnel so there
// are no assets to host. Keep the catalog small and fun.
export const GIFT_CATALOG = [
  { emoji: "🎁", name: "Подарок" },
  { emoji: "🌹", name: "Роза" },
  { emoji: "💐", name: "Букет" },
  { emoji: "🧸", name: "Мишка" },
  { emoji: "🎂", name: "Торт" },
  { emoji: "⭐", name: "Звезда" },
  { emoji: "💎", name: "Бриллиант" },
  { emoji: "🏆", name: "Кубок" },
  { emoji: "🚀", name: "Ракета" },
  { emoji: "❤️", name: "Сердце" },
  { emoji: "🍫", name: "Шоколад" },
  { emoji: "🎈", name: "Шарик" },
];

// Modal gift picker. onSend({emoji, name, note}) is awaited; the dialog shows
// a busy state and closes itself on success.
export default function GiftPicker({ open, recipientName, onClose, onSend }) {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const send = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    const res = await onSend({ ...selected, note: note.trim() });
    setBusy(false);
    if (res?.ok) {
      setSelected(null);
      setNote("");
      onClose();
    } else {
      setError(res?.error || "Не удалось отправить подарок");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="so-pop relative w-full max-w-sm rounded-2xl border border-[var(--border)] p-4 shadow-2xl"
        style={{ background: "var(--panel-bg)", backdropFilter: "blur(24px)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
            <GiftIcon className="h-5 w-5 text-violet-400" />
            Подарок{recipientName ? ` для ${recipientName}` : ""}
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--surface)]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {GIFT_CATALOG.map((g) => (
            <button
              key={g.name}
              onClick={() => setSelected(g)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all duration-200 ${
                selected?.name === g.name
                  ? "scale-105 border-violet-400 bg-violet-500/15"
                  : "border-transparent bg-[var(--surface)] hover:scale-105"
              }`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{g.name}</span>
            </button>
          ))}
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Подпись к подарку (необязательно)"
          className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-violet-400"
        />

        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

        <button
          onClick={send}
          disabled={!selected || busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          style={{ background: PURPLE_GRAD }}
        >
          {busy ? <span className="loading loading-spinner loading-xs" /> : <GiftIcon className="h-4 w-4" />}
          Отправить {selected ? selected.emoji : ""}
        </button>
      </div>
    </div>
  );
}
