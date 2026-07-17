import { useSelector } from "react-redux";

const NAV_ITEMS = [
  { icon: "👤", label: "Mening profilim" },
  { icon: "👥", label: "Guruh yaratish" },
  { icon: "📢", label: "Kanal yaratish" },
  { icon: "📋", label: "Mening kontaktlarim" },
  { icon: "📞", label: "Qo'ng'iroqlar" },
  { icon: "⚙️", label: "Sozlamalar" },
];

function getInitials(firstName, lastName) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase();
}

export default function ProfileDrawer({ isOpen, onClose }) {
  const user = useSelector((state) => state.auth.user);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-72 bg-base-100 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end px-4 pt-4">
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            title="Yopish"
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

        {/* User Profile Section */}
        {user && (
          <div className="flex flex-col items-center gap-3 px-6 py-4">
            {/* Large Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-content text-2xl font-bold">
              {getInitials(user.firstName, user.lastName)}
            </div>

            {/* Name + Verified Badge */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                {user.firstName} {user.lastName}
              </span>
              <span
                className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                title="Tasdiqlangan"
              >
                ✓
              </span>
            </div>

            {/* Email */}
            <span className="text-sm text-base-content/50">{user.email}</span>
          </div>
        )}

        {/* Divider */}
        <div className="divider my-1 mx-4" />

        {/* Nav Menu */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 cursor-pointer transition-colors text-left">
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
