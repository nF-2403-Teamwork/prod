import { useEffect, useRef, useState } from "react";

import { useWebSocket } from "../context/WebSocketContext";

const STATUS_META = {
  idle: { label: "Idle", badge: "badge-ghost", dot: "bg-base-content/40" },
  connecting: { label: "Connecting", badge: "badge-warning", dot: "bg-warning" },
  open: { label: "Connected", badge: "badge-success", dot: "bg-success" },
  closed: { label: "Disconnected", badge: "badge-neutral", dot: "bg-base-content/40" },
  error: { label: "Connection error", badge: "badge-error", dot: "bg-error" },
};

function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Chat() {
  const {
    status,
    messages,
    sendMessage,
    reconnect,
    disconnect,
    clearMessages,
    url,
  } = useWebSocket();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const meta = STATUS_META[status] ?? STATUS_META.idle;
  const isOpen = status === "open";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sendMessage(draft)) setDraft("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-bold">
              Live channel
              <span className={`badge ${meta.badge} gap-1.5`}>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${meta.dot} ${
                    status === "connecting" ? "animate-pulse" : ""
                  }`}
                />
                {meta.label}
              </span>
            </h1>
            <p className="mt-1 truncate text-xs text-base-content/60" title={url}>
              {url}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            {isOpen ? (
              <button onClick={disconnect} className="btn btn-outline btn-sm">
                Disconnect
              </button>
            ) : (
              <button onClick={reconnect} className="btn btn-primary btn-sm">
                {status === "connecting" && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Reconnect
              </button>
            )}
            <button
              onClick={clearMessages}
              className="btn btn-ghost btn-sm"
              disabled={messages.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Messages"
          className="h-[55vh] space-y-2 overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-base-content/50">
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs">
                Send a message — it broadcasts to everyone on the channel.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              if (m.direction === "system") {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="badge badge-ghost badge-sm">{m.text}</span>
                  </div>
                );
              }
              const outgoing = m.direction === "out";
              return (
                <div
                  key={m.id}
                  className={`chat ${outgoing ? "chat-end" : "chat-start"}`}
                >
                  <div className="chat-header text-xs opacity-60">
                    {outgoing ? "You" : "Server"}
                    <time className="ml-1">{timeLabel(m.ts)}</time>
                  </div>
                  <div
                    className={`chat-bubble whitespace-pre-wrap break-words ${
                      outgoing ? "chat-bubble-primary" : ""
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-base-300 p-3"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isOpen ? "Type a message…" : "Not connected"}
            className="input input-bordered flex-1"
            aria-label="Message to send"
            disabled={!isOpen}
            maxLength={2000}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isOpen || draft.trim().length === 0}
          >
            Send
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-base-content/50">
        Real-time channel over Socket.IO with automatic reconnection. Protected
        route — visible only when signed in.
      </p>
    </div>
  );
}
