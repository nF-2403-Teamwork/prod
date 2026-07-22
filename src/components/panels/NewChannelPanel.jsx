import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useWebSocket } from "../../context/WebSocketContext";
import { fileToAvatarDataURL } from "../../lib/image";
import PanelToast from "./PanelToast";
import { XIcon, CameraIcon, MegaphoneIcon } from "../icons";

const PURPLE_GRAD = "linear-gradient(135deg,#8b5cf6,#6366f1)";

// Create a broadcast channel: photo, name, optional bio. The creator becomes the
// owner; everyone else joins as a subscriber who can read but not post.
export default function NewChannelPanel({ onClose }) {
  const navigate = useNavigate();
  const { createRoom } = useWebSocket();
  const fileRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("success");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataURL(file));
    } catch {
      setToastTone("error");
      setToast("Не удалось прочитать изображение");
    }
  };

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await createRoom({
      kind: "channel",
      name: name.trim(),
      bio: bio.trim(),
      avatar,
    });
    setBusy(false);
    if (!res?.ok) {
      setToastTone("error");
      setToast(res?.error || "Не удалось создать канал");
      return;
    }
    setToastTone("success");
    setToast("Канал создан");
    setTimeout(() => {
      onClose();
      navigate(`/room/${res.room.id}`);
    }, 700);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">Новый канал</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--text-mid)] transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-95"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="so-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="so-pop group relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-[var(--ring)] transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            style={{ background: PURPLE_GRAD }}
            aria-label="Фото канала"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-white">
                <MegaphoneIcon className="h-8 w-8" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <CameraIcon className="h-6 w-6" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          <span className="text-xs text-[var(--text-muted)]">Фото канала</span>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-[var(--text-mid)]">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              placeholder="Название канала"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#9db0f7]/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--text-mid)]">
              Описание <span className="text-[var(--text-faint)]">(необязательно)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={255}
              rows={3}
              placeholder="Пару слов о канале"
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#9db0f7]/60"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <button
          onClick={create}
          disabled={!name.trim() || busy}
          className="min-h-[44px] w-full rounded-xl py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          style={{ background: PURPLE_GRAD }}
        >
          {busy ? "Создание…" : "Создать канал"}
        </button>
      </div>

      <PanelToast message={toast} onDone={() => setToast("")} tone={toastTone} />
    </div>
  );
}
