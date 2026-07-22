import { useState } from "react";
import { useSelector } from "react-redux";

import { nameOf, initialsOf } from "../../lib/format";
import PanelToast from "./PanelToast";
import {
  XIcon,
  MoreVerticalIcon,
  VerifiedIcon,
  SendPlaneIcon,
  PlusCircleIcon,
  ArrowUpIcon,
  SwapIcon,
  DollarCircleIcon,
} from "../icons";

const ACTIONS = [
  { key: "send", label: "Перевести", icon: SendPlaneIcon },
  { key: "topup", label: "Пополнить", icon: PlusCircleIcon },
  { key: "withdraw", label: "Вывести", icon: ArrowUpIcon },
  { key: "swap", label: "Обменять", icon: SwapIcon },
];

function ActionButton({ label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--field)] py-3 text-[var(--text)] transition hover:-translate-y-0.5 hover:bg-[var(--surface-hover)] active:translate-y-0"
    >
      <Icon className="h-5 w-5 text-[var(--accent)]" />
      <span className="text-[12px]">{label}</span>
    </button>
  );
}

// Crypto wallet screen — visual match of the reference. Interactive but the
// balances are presentational (no on-chain backend).
export default function WalletPanel({ onClose }) {
  const me = useSelector((s) => s.auth.user);
  const [tab, setTab] = useState("crypto");
  const [banner, setBanner] = useState(true);
  const [toast, setToast] = useState("");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">Кошелёк</h2>
          <VerifiedIcon className="h-5 w-5 text-sky-400" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setToast("Меню кошелька — скоро")}
            className="rounded-full p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
            aria-label="Ещё"
          >
            <MoreVerticalIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
            aria-label="Закрыть"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {/* Avatar + segmented toggle */}
        <div className="mt-1 flex items-center gap-3">
          {me?.avatar ? (
            <img src={me.avatar} alt={nameOf(me)} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
            >
              {initialsOf(me)}
            </span>
          )}
          <div className="mx-auto flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
            {[
              { k: "crypto", label: "Крипто" },
              { k: "defi", label: "DeFi" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`rounded-full px-6 py-1.5 text-sm font-medium transition ${
                  tab === t.k ? "text-[#171528]" : "text-[var(--text-mid)] hover:text-white"
                }`}
                style={tab === t.k ? { background: "#e9e7f2" } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="h-10 w-10" aria-hidden />
        </div>

        {/* Balance */}
        <div className="mt-8 text-center">
          <div className="text-sm text-[var(--text-muted)]">Баланс</div>
          <div className="mt-1 text-5xl font-bold tracking-tight text-[var(--text-strong)]">
            0,00 <span className="text-[var(--text-faint)]">$</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex gap-2.5">
          {ACTIONS.map((a) => (
            <ActionButton
              key={a.key}
              label={a.label}
              icon={a.icon}
              onClick={() => setToast(`${a.label} — скоро`)}
            />
          ))}
        </div>

        {/* Promo banner */}
        {banner && (
          <div className="mt-5">
            <div
              className="relative overflow-hidden rounded-2xl px-4 py-4"
              style={{ background: "linear-gradient(110deg,#7c5cf5,#a97bf0 55%,#c58bf0)" }}
            >
              <button
                onClick={() => setBanner(false)}
                className="absolute right-2 top-2 rounded-full bg-black/20 p-1 text-white/90 transition hover:bg-black/30"
                aria-label="Скрыть"
              >
                <XIcon className="h-4 w-4" />
              </button>
              <div className="max-w-[70%]">
                <div className="text-[15px] font-semibold text-white">
                  Доход на SOL 16.04% APY
                </div>
                <button
                  onClick={() => setToast("Стейкинг — скоро")}
                  className="mt-1 text-sm font-medium text-white/90 hover:text-white"
                >
                  Начать зарабатывать ›
                </button>
              </div>
              <div className="pointer-events-none absolute -right-2 bottom-1 text-5xl opacity-90">
                🪙
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === 0 ? 16 : 6,
                    background: i === 0 ? "#c3b4f5" : "rgba(255,255,255,.22)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Assets */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <button
            onClick={() => setToast("USDT — скоро")}
            className="flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-[var(--surface-2)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16a34a] text-white">
              <DollarCircleIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[15px] font-medium text-[var(--text-strong)]">Доллары</div>
              <div className="text-[13px] text-[var(--text-muted)]">USDT</div>
            </div>
            <div className="text-[15px] font-medium text-[var(--text-strong)]">0,00 $</div>
          </button>
        </div>
      </div>

      <PanelToast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
