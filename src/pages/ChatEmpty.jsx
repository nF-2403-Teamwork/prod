import { ChatBubbleIcon } from "../components/icons";

// Shown on the chat outlet when no contact is selected (desktop only — on
// mobile the sidebar fills the screen until a contact is opened).
export default function ChatEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[var(--text-muted)]">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] text-[var(--accent)]"
        style={{ background: "var(--surface-2)", backdropFilter: "blur(12px)" }}
      >
        <ChatBubbleIcon className="h-8 w-8" />
      </div>
      <p className="text-sm">Select a contact to start chatting</p>
    </div>
  );
}
