import { useCallback, useEffect, useRef, useState } from "react";

import { useCall } from "../context/CallContext";
import Avatar from "./Avatar";
import { nameOf } from "../lib/format";
import {
  PhoneIcon,
  PhoneMissedIcon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  ExpandIcon,
  ShrinkIcon,
  XIcon,
  AlertIcon,
} from "./icons";

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Bar buttons: glass by default, white when the control is "off" (muted /
// camera down), red for hang up, green for answer — as in the reference layout.
function CallButton({ onClick, label, variant = "glass", size = "md", children }) {
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const skin = {
    glass: { background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.16)" },
    off: { background: "rgba(255,255,255,.92)", color: "#1a1730", border: "1px solid transparent" },
    danger: { background: "#ff4d5e", color: "#fff", border: "1px solid transparent" },
    accept: { background: "#34d399", color: "#0b2c22", border: "1px solid transparent" },
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex ${dim} items-center justify-center rounded-full transition-all duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-95`}
      style={{ ...skin, backdropFilter: "blur(8px)" }}
    >
      {children}
    </button>
  );
}

// Full-screen call surface: ringing (in/out) and the active conversation.
// Rendered above everything; it owns no signalling of its own.
export default function CallOverlay() {
  const {
    call,
    localStream,
    remoteStream,
    muted,
    videoOn,
    accept,
    decline,
    hangup,
    toggleMute,
    toggleVideo,
    dismissError,
  } = useCall();

  const cardRef = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const remoteAudio = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const peer = call.peer;
  const ringing = call.phase === "ringing";
  const calling = call.phase === "calling";
  const active = call.phase === "active";
  const showRemoteVideo = active && call.peerVideo && remoteStream;

  useEffect(() => {
    if (localVideo.current && localStream) localVideo.current.srcObject = localStream;
  }, [localStream, videoOn, call.phase]);

  useEffect(() => {
    if (remoteVideo.current && remoteStream) remoteVideo.current.srcObject = remoteStream;
    // Audio-only calls still need a sink for the remote track to be heard.
    if (remoteAudio.current && remoteStream) remoteAudio.current.srcObject = remoteStream;
  }, [remoteStream, showRemoteVideo, call.phase]);

  useEffect(() => {
    if (remoteAudio.current) remoteAudio.current.muted = speakerOff;
    if (remoteVideo.current) remoteVideo.current.muted = true;
  }, [speakerOff, showRemoteVideo]);

  useEffect(() => {
    if (call.phase !== "active") {
      setSeconds(0);
      return undefined;
    }
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [call.phase]);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else cardRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const errorToast = call.error ? (
    <div className="pointer-events-auto fixed inset-x-0 top-4 z-[140] mx-auto w-fit max-w-[92vw]">
      <div
        role="alert"
        className="so-pop flex items-center gap-2 rounded-xl border border-[#ff5d6c]/30 px-4 py-3 text-sm text-[#ffb4ab] shadow-lg"
        style={{ background: "rgba(40,20,30,.92)", backdropFilter: "blur(12px)" }}
      >
        <AlertIcon className="h-5 w-5 shrink-0" />
        <span>{call.error}</span>
        <button
          onClick={dismissError}
          className="ml-2 rounded-lg p-1 text-[var(--text-mid)] transition-all duration-200 hover:bg-white/10 active:scale-95"
          aria-label="Закрыть"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  ) : null;

  // An error with no live call (declined, busy, no devices) is just the toast.
  if (call.phase === "idle") return errorToast;

  const status = ringing
    ? call.video
      ? "Входящий видеозвонок…"
      : "Входящий звонок…"
    : calling
      ? "Вызов…"
      : fmt(seconds);

  return (
    <>
      {errorToast}
      <div
        className="fade-in fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={ringing ? "Входящий звонок" : "Звонок"}
        style={{ background: "rgba(8,7,14,.72)", backdropFilter: "blur(18px)" }}
      >
        <div
          ref={cardRef}
          className="so-pop relative flex h-full w-full flex-col overflow-hidden sm:h-auto sm:max-h-[88vh] sm:min-h-[560px] sm:w-full sm:max-w-5xl sm:rounded-[28px]"
          style={{
            background:
              "linear-gradient(160deg, rgba(124,92,245,.20) 0%, rgba(20,18,32,.86) 55%, rgba(13,12,20,.92) 100%)",
            // The call surface stays dark in both themes, so the glass edge is
            // a fixed white alpha rather than the theme's border token.
            border: "1px solid rgba(255,255,255,.12)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.08), 0 40px 90px -30px rgba(0,0,0,.85)",
          }}
        >
          {/* Remote video fills the card once the peer's camera is on */}
          {showRemoteVideo && (
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full bg-black object-cover"
            />
          )}
          {/* Audio sink — required for audio-only calls to be audible */}
          <audio ref={remoteAudio} autoPlay />

          {/* Top bar: who you're talking to + fullscreen */}
          <header className="relative z-10 flex items-center justify-between gap-3 p-4 sm:p-5">
            <div
              className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4"
              style={{
                background: showRemoteVideo ? "rgba(12,10,20,.5)" : "transparent",
                backdropFilter: showRemoteVideo ? "blur(10px)" : "none",
              }}
            >
              <Avatar user={peer} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{nameOf(peer)}</p>
                <p className="text-xs text-white/60">
                  {active ? (call.peerVideo ? "Видео" : "Аудио") : status}
                </p>
              </div>
              {active && call.peerMuted && (
                <span
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,77,94,.9)" }}
                  title="Собеседник выключил микрофон"
                >
                  <MicOffIcon className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>

            <CallButton onClick={toggleFullscreen} size="sm" label={fullscreen ? "Свернуть" : "Развернуть"}>
              {fullscreen ? <ShrinkIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
            </CallButton>
          </header>

          {/* Stage: peer video, or avatar + timer for audio */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-4">
            {!showRemoteVideo && (
              <>
                <Avatar user={peer} size="xl" className="ring-4 ring-white/15" />
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-white">{nameOf(peer)}</h2>
                  <p className="mt-1 text-sm tabular-nums text-white/60">{status}</p>
                </div>
              </>
            )}
          </div>

          {/* Self view — only while our own camera is on */}
          {videoOn && localStream && (
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-4 z-10 h-28 w-40 rounded-2xl bg-black object-cover shadow-2xl sm:bottom-28 sm:h-32 sm:w-48"
              style={{ border: "1px solid rgba(255,255,255,.18)", transform: "scaleX(-1)" }}
            />
          )}

          {/* Control bar */}
          <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-4 sm:p-6">
            <div className="flex justify-start">
              {active && (
                <CallButton
                  onClick={() => setSpeakerOff((v) => !v)}
                  size="sm"
                  variant={speakerOff ? "off" : "glass"}
                  label={speakerOff ? "Включить звук" : "Выключить звук"}
                >
                  {speakerOff ? <SpeakerOffIcon className="h-4 w-4" /> : <SpeakerIcon className="h-4 w-4" />}
                </CallButton>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {ringing ? (
                <>
                  <CallButton onClick={decline} variant="danger" label="Отклонить">
                    <PhoneMissedIcon className="h-6 w-6" />
                  </CallButton>
                  <CallButton onClick={accept} variant="accept" label="Ответить">
                    <PhoneIcon className="h-6 w-6" />
                  </CallButton>
                </>
              ) : (
                <>
                  <CallButton
                    onClick={toggleVideo}
                    variant={videoOn ? "glass" : "off"}
                    label={videoOn ? "Выключить камеру" : "Включить камеру"}
                  >
                    {videoOn ? <VideoIcon className="h-6 w-6" /> : <VideoOffIcon className="h-6 w-6" />}
                  </CallButton>
                  <CallButton
                    onClick={toggleMute}
                    variant={muted ? "off" : "glass"}
                    label={muted ? "Включить микрофон" : "Выключить микрофон"}
                  >
                    {muted ? <MicOffIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
                  </CallButton>
                  <CallButton onClick={hangup} variant="danger" label="Завершить">
                    <PhoneMissedIcon className="h-6 w-6" />
                  </CallButton>
                </>
              )}
            </div>

            <div className="flex justify-end" />
          </div>
        </div>
      </div>
    </>
  );
}
