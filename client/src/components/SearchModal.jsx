import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setSearchResults,
  setSearchLoading,
  clearSearch,
} from "../store/chatSlice";
import socket from "../socket/socket";

export default function SearchModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const contacts = useSelector((state) => state.chat.contacts);
  const searchResults = useSelector((state) => state.chat.searchResults);
  const searchLoading = useSelector((state) => state.chat.searchLoading);

  const [searchEmail, setSearchEmail] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (isOpen === false) return;

    function handleSearchResponse({ success, users }) {
      dispatch(setSearchLoading(false));
      if (success) {
        dispatch(setSearchResults(users));
      }
    }

    function handleAddFriendResponse({ success, message, targetUserId }) {
      if (success && targetUserId) {
        setSentRequests((prev) => [...prev, targetUserId]);
        setToast({ type: "success", text: message });
      } else {
        setToast({ type: "error", text: message || "Xatolik yuz berdi." });
      }
      setTimeout(() => setToast(null), 3000);
    }

    socket.on("search_user_response", handleSearchResponse);
    socket.on("add_friend_response", handleAddFriendResponse);

    return () => {
      socket.off("search_user_response", handleSearchResponse);
      socket.off("add_friend_response", handleAddFriendResponse);
    };
  }, [isOpen, dispatch]);

  // isOpen=false means explicitly hidden; undefined means parent controls mounting
  if (isOpen === false) return null;

  function handleSearch() {
    if (!searchEmail.trim()) return;
    setHasSearched(true);
    dispatch(setSearchLoading(true));
    socket.emit("search_user", {
      email: searchEmail.trim(),
      userId: user?.id,
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function handleClose() {
    dispatch(clearSearch());
    setSearchEmail("");
    setHasSearched(false);
    setToast(null);
    onClose();
  }

  function handleAddFriend(targetUserId) {
    socket.emit("add_friend", {
      targetUserId,
      userId: user?.id,
    });
  }

  function isAlreadyContact(userId) {
    return contacts.some((c) => c._id === userId);
  }

  function getInitials(firstName, lastName) {
    const f = firstName?.[0] ?? "";
    const l = lastName?.[0] ?? "";
    return (f + l).toUpperCase();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-md bg-base-100 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Foydalanuvchi qidirish</h2>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            aria-label="Yopish"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search Input Row */}
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email manzilini kiriting..."
            className="input input-bordered flex-1"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={searchLoading || !searchEmail.trim()}
          >
            Qidirish
          </button>
        </div>

        {/* Results Section */}
        <div className="flex flex-col gap-1 min-h-[80px]">
          {searchLoading && (
            <div className="flex justify-center items-center py-6">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          )}

          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-base-content/50 gap-2">
              <span className="text-2xl">🔍</span>
              <span className="text-sm">Natija topilmadi</span>
            </div>
          )}

          {!searchLoading &&
            searchResults.map((result) => {
              const alreadyAdded = isAlreadyContact(result._id);
              const requestSent = sentRequests.includes(result._id);
              return (
                <div
                  key={result._id}
                  className="flex items-center gap-3 p-3 border border-base-300 rounded-lg mb-2"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-semibold text-sm flex-shrink-0">
                    {getInitials(result.firstName, result.lastName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {result.firstName} {result.lastName}
                    </p>
                    <p className="text-xs text-base-content/50 truncate">
                      {result.email}
                    </p>
                  </div>

                  {/* Action */}
                  {alreadyAdded ? (
                    <span className="badge badge-success badge-sm shrink-0">
                      Do'st
                    </span>
                  ) : requestSent ? (
                    <span className="badge badge-info badge-sm shrink-0">
                      So'rov yuborildi
                    </span>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline btn-primary shrink-0"
                      onClick={() => handleAddFriend(result._id)}
                    >
                      Do'st qo'shish
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`alert py-2 text-sm ${
              toast.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <span>{toast.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
