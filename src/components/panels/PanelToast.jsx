import { useEffect, useState } from "react";

// Small floating toast used inside the slide-over panels. Slides/fades in on
// mount and back out before unmounting.
export default function PanelToast({ message, onDone, tone = "info" }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!message) return undefined;
    const raf = requestAnimationFrame(() => setShown(true));
    const hide = setTimeout(() => setShown(false), 2400);
    const done = setTimeout(() => onDone?.(), 2700);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [message, onDone]);

  if (!message) return null;
  const bg =
    tone === "success"
      ? "linear-gradient(120deg,#22c55e,#16a34a)"
      : tone === "error"
        ? "linear-gradient(120deg,#ef4444,#dc2626)"
        : "linear-gradient(120deg,#8b5cf6,#a78bfa)";
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div
        className="rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-2xl transition-all duration-300"
        style={{
          background: bg,
          opacity: shown ? 1 : 0,
          transform: shown ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
        }}
        role="status"
      >
        {message}
      </div>
    </div>
  );
}
