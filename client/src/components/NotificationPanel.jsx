import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { markAllRead, removeNotification } from "../store/notificationSlice";
import { addToContacts, addToChats } from "../store/chatSlice";
import socket from "../socket/socket";

function getInitials(firstName, lastName) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase();
}

function formatTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Hozir";
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHr < 24) return `${diffHr} soat oldin`;
  if (diffDay < 7) return `${diffDay} kun oldin`;

  return date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const list = useSelector((state) => state.notification.list);
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    function handleAcceptResponse({ success, requestId, contact }) {
      if (success && contact) {
        dispatch(addToContacts(contact));
        dispatch(addToChats(contact));
      }
      dispatch(removeNotification(requestId));
    }

    function handleRejectResponse({ requestId }) {
      dispatch(removeNotification(requestId));
    }

    socket.on("accept_friend_response", handleAcceptResponse);
    socket.on("reject_friend_response", handleRejectResponse);

    return () => {
      socket.off("accept_friend_response", handleAcceptResponse);
      socket.off("reject_friend_response", handleRejectResponse);
    };
  }, [dispatch]);

  function handleAccept(notification) {
    socket.emit("accept_friend_request", {
      requestId: notification.requestId,
      userId,
    });
  }

  function handleReject(notification) {
    socket.emit("reject_friend_request", {
      requestId: notification.requestId,
      userId,
    });
  }

  function handleMarkAllRead() {
    dispatch(markAllRead());
  }

  return (
    <div className="absolute right-0 top-12 w-80 bg-base-100 shadow-xl rounded-2xl z-50 border border-base-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <span className="font-semibold text-sm">Bildirishnomalar</span>
        <button className="btn btn-ghost btn-xs" onClick={handleMarkAllRead}>
          Barchasini o'qildi
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-base-content/50">
            <span className="text-3xl">🔔</span>
            <span className="text-sm">Bildirishnoma yo'q</span>
          </div>
        ) : (
          <ul>
            {list.map((notification) => (
              <li
                key={notification._id}
                className="flex flex-col gap-2 px-4 py-3 hover:bg-base-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-content font-semibold text-sm flex-shrink-0 mt-0.5">
                    {getInitials(
                      notification.from?.firstName,
                      notification.from?.lastName
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">
                        {notification.from?.firstName}{" "}
                        {notification.from?.lastName}
                      </span>{" "}
                      {notification.type === "friend_request"
                        ? "sizga do'stlik so'rovi yubordi"
                        : "do'stlik so'rovingizni qabul qildi"}
                    </p>
                    <span className="text-xs text-base-content/40 mt-0.5">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Accept / Reject */}
                {notification.type === "friend_request" && (
                  <div className="flex gap-2 pl-[52px]">
                    <button
                      className="btn btn-primary btn-xs flex-1"
                      onClick={() => handleAccept(notification)}
                    >
                      Qabul qilish
                    </button>
                    <button
                      className="btn btn-ghost btn-xs flex-1"
                      onClick={() => handleReject(notification)}
                    >
                      Rad etish
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
