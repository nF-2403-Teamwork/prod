import { CheckIcon, ChevronRightIcon, AlertIcon } from "../icons";

export const PURPLE_GRAD = "linear-gradient(120deg, #8b5cf6 0%, #a78bfa 100%)";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

// Grouped card — the Telegram "block of rows" look.
export function Group({ title, children, className = "" }) {
  return (
    <section className={`mt-4 ${className}`}>
      {title && (
        <h3 className="px-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
          {title}
        </h3>
      )}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {children}
      </div>
    </section>
  );
}

export function Divider() {
  return <div className="ml-14 border-t border-[var(--border-soft)]" />;
}

// Footnote under a group. `tone="warn"` is for the honest "this isn't wired up
// / isn't enforced" disclaimers, which must not read like decoration.
export function Note({ children, tone = "muted" }) {
  if (tone === "warn") {
    return (
      <p className="mt-2 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-mid)]">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--st-danger)]" />
        <span>{children}</span>
      </p>
    );
  }
  return (
    <p className="mt-2 px-4 text-[12px] leading-relaxed text-[var(--text-muted)]">{children}</p>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${FOCUS}`}
      style={{ background: checked ? PURPLE_GRAD : "var(--switch-off)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? "22px" : "2px" }}
      />
    </button>
  );
}

// Navigation / action row.
export function Row({ icon, label, hint, right, onClick, danger, as = "button" }) {
  const body = (
    <>
      {icon && (
        <span
          className="shrink-0"
          style={{ color: danger ? "var(--st-danger)" : "var(--accent)" }}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className="block text-[15px]"
          style={{ color: danger ? "var(--st-danger)" : "var(--text-strong)" }}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[12px] leading-snug text-[var(--text-muted)]">
            {hint}
          </span>
        )}
      </span>
      {right}
    </>
  );

  const cls = `flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-hover)] ${FOCUS}`;

  if (as === "div") {
    return <div className={cls.replace("hover:bg-[var(--surface-hover)]", "")}>{body}</div>;
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export function NavRow({ icon, label, hint, badge, onClick }) {
  return (
    <Row
      icon={icon}
      label={label}
      hint={hint}
      onClick={onClick}
      right={
        <span className="flex shrink-0 items-center gap-2">
          {badge && <span className="text-[13px] text-[var(--text-muted)]">{badge}</span>}
          <ChevronRightIcon className="h-5 w-5 text-[var(--text-faint)]" />
        </span>
      }
    />
  );
}

export function ToggleRow({ icon, label, hint, checked, onChange }) {
  return (
    <div className="flex min-h-[44px] w-full items-center gap-3 px-4 py-3">
      {icon && <span className="shrink-0 text-[var(--accent)]">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] text-[var(--text-strong)]">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[12px] leading-snug text-[var(--text-muted)]">
            {hint}
          </span>
        )}
      </span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

// Single-select row inside a group.
export function ChoiceRow({ label, hint, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-hover)] ${FOCUS}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] text-[var(--text-strong)]">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[12px] text-[var(--text-muted)]">{hint}</span>
        )}
      </span>
      {selected && <CheckIcon className="h-5 w-5 shrink-0 text-[var(--accent)]" />}
    </button>
  );
}

export function StatLine({ label, value, muted }) {
  return (
    <div className="flex min-h-[36px] items-center justify-between gap-3 px-4 py-2">
      <span className="text-[14px] text-[var(--text-mid)]">{label}</span>
      <span
        className="shrink-0 text-[13px] tabular-nums"
        style={{ color: muted ? "var(--text-muted)" : "var(--text-strong)" }}
      >
        {value}
      </span>
    </div>
  );
}
