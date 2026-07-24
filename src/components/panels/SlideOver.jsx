import { useEffect, useState } from "react";

// Glassy slide-over panel. Anchored left by default, sitting just right of the
// icon rail on desktop and full-width on mobile; pass side="right" for the
// account drawer. Handles its own mount/unmount transition so callers only pass
// `open` / `onClose`.
export default function SlideOver({
  open,
  onClose,
  children,
  width = 384,
  label,
  side = "left",
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let raf;
    let timer;
    if (open) {
      setMounted(true);
      raf = requestAnimationFrame(() => setShown(true));
    } else {
      setShown(false);
      timer = setTimeout(() => setMounted(false), 280);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const right = side === "right";

  return (
    <div className="fixed inset-0 z-[60]" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0, backdropFilter: "blur(2px)" }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute inset-y-0 flex w-full flex-col overflow-hidden shadow-2xl md:w-[var(--so-w)] ${
          right
            ? "right-0 border-l border-[var(--border)]"
            : "left-0 border-r border-[var(--border)] md:left-[68px]"
        }`}
        style={{
          "--so-w": `${width}px`,
          maxWidth: "100vw",
          background: "var(--panel-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transform: shown
            ? "translateX(0)"
            : `translateX(${right ? "102%" : "-102%"})`,
          opacity: shown ? 1 : 0.4,
          transition:
            "transform .32s cubic-bezier(.22,1,.36,1), opacity .32s ease",
        }}
      >
        {children}
      </aside>
    </div>
  );
}
