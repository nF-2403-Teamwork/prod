import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { setActiveChat, addToContacts, addToChats } from "../store/chatSlice";
import {
  markAllRead,
  addNotification,
  setNotifications,
} from "../store/notificationSlice";
import NotificationPanel from "./NotificationPanel";
import SearchModal from "./SearchModal";
import socket from "../socket/socket";

export default function Sidebar({ isDrawerOpen, setIsDrawerOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const chats = useSelector((state) => state.chat.chats);
  const activeChat = useSelector((state) => state.chat.activeChat);
  const unreadCount = useSelector((state) => state.notification.unreadCount);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Kutayotgan do'stlik so'rovlarini yuklash (offline paytda kelganlar ham)
    if (user?.id) {
      socket.emit("get_friend_requests", { userId: user.id });
    }

    function handleRequestsList({ requests }) {
      dispatch(
        setNotifications(
          requests.map((r) => ({
            _id: r.requestId,
            requestId: r.requestId,
            from: r.from,
            type: "friend_request",
            createdAt: r.createdAt,
          }))
        )
      );
    }

    function handleFriendRequest(data) {
      dispatch(
        addNotification({
          _id: data.requestId,
          requestId: data.requestId,
          from: data.from,
          type: "friend_request",
          createdAt: data.createdAt || new Date().toISOString(),
        })
      );
    }

    function handleRequestAccepted({ contact }) {
      dispatch(addToContacts(contact));
      dispatch(addToChats(contact));
      dispatch(
        addNotification({
          _id: `accepted-${contact._id}-${Date.now()}`,
          from: contact,
          type: "request_accepted",
          createdAt: new Date().toISOString(),
        })
      );
    }

    socket.on("friend_requests_list", handleRequestsList);
    socket.on("friend_request", handleFriendRequest);
    socket.on("friend_request_accepted", handleRequestAccepted);

    return () => {
      socket.off("friend_requests_list", handleRequestsList);
      socket.off("friend_request", handleFriendRequest);
      socket.off("friend_request_accepted", handleRequestAccepted);
    };
  }, [dispatch, user?.id]);

  function getInitials(firstName, lastName) {
    const f = firstName?.[0] ?? "";
    const l = lastName?.[0] ?? "";
    return (f + l).toUpperCase();
  }

  function handleNotifToggle() {
    setIsNotifOpen((prev) => !prev);
    if (!isNotifOpen) {
      dispatch(markAllRead());
    }
  }

  function handleLogout() {
    dispatch(logout());
    navigate("/login");
  }

  return (
    <aside className="w-80 flex flex-col h-full bg-base-100 border-r border-base-300 relative flex-shrink-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <span className="text-lg font-bold text-primary">💬 TezChat</span>
        <div className="flex gap-1">
          {/* Menu / Profile Drawer */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => setIsDrawerOpen(true)}
            title="Profil"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Notification */}
          <button
            className="btn btn-ghost btn-sm btn-circle relative"
            onClick={handleNotifToggle}
            title="Bildirishnomalar"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="badge badge-error badge-xs absolute -top-0.5 -right-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleLogout}
            title="Chiqish"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {isNotifOpen && (
        <NotificationPanel onClose={() => setIsNotifOpen(false)} />
      )}

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-base-300">
        <div
          className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2 cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-base-content/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Email orqali qidirish..."
            className="bg-transparent outline-none text-sm w-full cursor-pointer text-base-content/60"
            readOnly
            onFocus={() => setIsSearchOpen(true)}
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/40 gap-2">
            <span className="text-3xl">💬</span>
            <span className="text-sm">Chatlar yo'q</span>
          </div>
        ) : (
          <ul>
            {chats.map((chat) => (
              <li
                key={chat._id}
                onClick={() => dispatch(setActiveChat(chat))}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors ${
                  activeChat?._id === chat._id ? "bg-base-200" : ""
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-semibold text-sm flex-shrink-0">
                  {getInitials(chat.firstName, chat.lastName)}
                </div>
                {/* Info */}
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-sm truncate">
                    {chat.firstName} {chat.lastName}
                  </span>
                  <span className="text-xs text-base-content/50 truncate">
                    {chat.lastMessage || chat.email}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom User Info */}
      {user && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-base-300">
          <div className="w-9 h-9 rounded-full bg-neutral flex items-center justify-center text-neutral-content font-semibold text-sm flex-shrink-0">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm truncate">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-base-content/50 truncate">
              {user.email}
            </span>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal onClose={() => setIsSearchOpen(false)} />
      )}
    </aside>
  );
}
