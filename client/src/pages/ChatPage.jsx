import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import ProfileDrawer from "../components/ProfileDrawer";
import socket from "../socket/socket";
import {
  setChats,
  setContacts,
  setMessages,
  addMessage,
  updateLastMessage,
} from "../store/chatSlice";

function getInitials(firstName, lastName) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase();
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const activeChat = useSelector((state) => state.chat.activeChat);
  const messages = useSelector((state) => state.chat.messages);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Serverga o'zini tanitish (userId -> socketId mapping uchun)
  useEffect(() => {
    if (!userId) return;

    socket.emit("register_user", { userId });

    function handleReconnect() {
      socket.emit("register_user", { userId });
    }
    socket.on("connect", handleReconnect);
    return () => socket.off("connect", handleReconnect);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    socket.emit("get_chats", { userId });
    socket.emit("get_contacts", { userId });

    function handleChatsList({ chats }) {
      dispatch(setChats(chats));
    }

    function handleContactsList({ contacts }) {
      dispatch(setContacts(contacts));
    }

    socket.on("chats_list", handleChatsList);
    socket.on("contacts_list", handleContactsList);

    return () => {
      socket.off("chats_list", handleChatsList);
      socket.off("contacts_list", handleContactsList);
    };
  }, [userId, dispatch]);

  // Tanlangan chat tarixini yuklash
  useEffect(() => {
    if (!userId || !activeChat) return;

    socket.emit("get_messages", { userId, contactId: activeChat._id });

    function handleMessagesList({ contactId, messages: msgs }) {
      if (contactId === activeChat._id) {
        dispatch(setMessages(msgs));
      }
    }

    socket.on("messages_list", handleMessagesList);
    return () => socket.off("messages_list", handleMessagesList);
  }, [userId, activeChat, dispatch]);

  // Kelayotgan xabarlarni qabul qilish
  useEffect(() => {
    function handleNewMessage({ message }) {
      dispatch(updateLastMessage({ contactId: message.sender, text: message.text }));
      if (activeChat && message.sender === activeChat._id) {
        dispatch(addMessage(message));
      }
    }

    function handleSendResponse({ success, message }) {
      if (success) {
        dispatch(addMessage(message));
        dispatch(updateLastMessage({ contactId: message.recipient, text: message.text }));
      }
    }

    socket.on("new_message", handleNewMessage);
    socket.on("send_message_response", handleSendResponse);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("send_message_response", handleSendResponse);
    };
  }, [activeChat, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeChat || !userId) return;

    socket.emit("send_message", {
      senderId: userId,
      recipientId: activeChat._id,
      text: trimmed,
    });
    setText("");
  }

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-[#8bb3d9]/20">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-black/10 text-sm text-base-content/60">
              Yozishmani boshlash uchun chat tanlang
            </span>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-base-100 shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-semibold text-sm">
                {getInitials(activeChat.firstName, activeChat.lastName)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {activeChat.firstName} {activeChat.lastName}
                </span>
                <span className="text-xs text-base-content/50">
                  {activeChat.email}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-16 py-4 flex flex-col gap-1">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="px-4 py-2 rounded-2xl bg-black/10 text-sm text-base-content/60">
                    Hozircha xabarlar yo'q. Birinchi xabarni yozing!
                  </span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender === userId;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-[75%] lg:max-w-[60%] px-3 py-1.5 shadow-sm text-[15px] leading-snug ${
                          isMine
                            ? "bg-primary text-primary-content rounded-2xl rounded-br-md"
                            : "bg-base-100 text-base-content rounded-2xl rounded-bl-md"
                        }`}
                      >
                        <span className="break-words whitespace-pre-wrap pr-12">
                          {msg.text}
                        </span>
                        <span
                          className={`float-right ml-2 mt-2 text-[11px] ${
                            isMine
                              ? "text-primary-content/70"
                              : "text-base-content/40"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input — Telegram style */}
            <div className="px-4 lg:px-16 pb-4 pt-1">
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 bg-base-100 rounded-2xl shadow-md px-3 py-2"
              >
                {/* Attach icon (dekorativ) */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-circle text-base-content/40"
                  tabIndex={-1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Xabar"
                  className="flex-1 bg-transparent outline-none text-[15px] py-1.5 min-w-0"
                  autoFocus
                />

                <button
                  type="submit"
                  className={`btn btn-circle btn-sm border-none ${
                    text.trim()
                      ? "btn-primary"
                      : "btn-ghost text-base-content/30"
                  }`}
                  disabled={!text.trim()}
                  aria-label="Yuborish"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </main>
      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
