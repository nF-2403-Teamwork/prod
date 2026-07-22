import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { logout } from "../store/authSlice";
import { accountRemoved } from "../store/accountsSlice";
import { toggleTheme } from "../store/uiSlice";
import { useWebSocket } from "../context/WebSocketContext";
import Avatar from "../components/Avatar";
import RoomAvatar from "../components/RoomAvatar";
import ProfileEditor from "../components/ProfileEditor";
import SlideOver from "../components/panels/SlideOver";
import ProfilePanel from "../components/panels/ProfilePanel";
import WalletPanel from "../components/panels/WalletPanel";
import ContactsPanel from "../components/panels/ContactsPanel";
import CallsPanel from "../components/panels/CallsPanel";
import NewChannelPanel from "../components/panels/NewChannelPanel";
import NewGroupPanel from "../components/panels/NewGroupPanel";
import SettingsPanel from "../components/panels/SettingsPanel";
import ContactProfilePanel from "../components/panels/ContactProfilePanel";
import FriendRequestsPanel from "../components/panels/FriendRequestsPanel";
import AccountDrawer from "../components/panels/AccountDrawer";
import {
  SearchIcon,
  LogOutIcon,
  VerifiedIcon,
  UserPlusIcon,
  UserCheckIcon,
  MoonIcon,
  UserIcon,
  UsersIcon,
  MegaphoneIcon,
  PhoneIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  BookmarkIcon,
  PlusIcon,
} from "../components/icons";
import { nameOf, shortTime, previewText, lastSeenText } from "../lib/format";

const PURPLE_GRAD = "linear-gradient(120deg, #8b5cf6 0%, #a78bfa 100%)";

// Living dark background with colour blooms — this is what makes the glass read.
const GLASS = {
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "inset 0 1px 0 var(--inset-hi)",
};

// A couple of menu glyphs the shared icon set doesn't ship.
const sv = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};
const WalletIcon = (p) => (
  <svg {...sv} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H6" />
    <circle cx="16.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const ContactsIcon = (p) => (
  <svg {...sv} {...p}>
    <rect x="4" y="3" width="14" height="18" rx="2" />
    <circle cx="11" cy="10" r="2.4" />
    <path d="M7.8 16c.6-1.5 1.8-2.2 3.2-2.2s2.6.7 3.2 2.2" />
    <path d="M18 7.5h2M18 12h2M18 16.5h2" />
  </svg>
);

function RailButton({ icon, label, badge = 0, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
        active ? "text-white" : "text-[var(--text-mid)] hover:bg-[var(--surface-hover)] hover:text-white"
      }`}
      style={active ? { background: PURPLE_GRAD } : undefined}
    >
      {icon}
      {badge > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ background: "#ff5d6c" }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function MenuRow({ icon, label, badge = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text)] transition hover:bg-[var(--surface-hover)]"
    >
      <span className="shrink-0 text-[var(--text-mid)]">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span
          className="rounded-full px-1.5 text-[11px] font-bold text-white"
          style={{ background: "#ff5d6c" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default function ChatLayout() {
  const { contactId, roomId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const me = useSelector((s) => s.auth.user);
  const accounts = useSelector((s) => s.accounts.list);
  const dark = useSelector((s) => s.ui.theme) === "dark";
  const {
    ready,
    contacts,
    contactsLoaded,
    rooms,
    typing,
    notifications,
    refreshContacts,
    refreshRooms,
    detach,
    switchAccount,
    searchUsers,
    searchRooms,
    joinRoom,
    sendFriendRequest,
    acceptFriend,
  } = useWebSocket();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); // expanded settings flyout
  const [accountOpen, setAccountOpen] = useState(false); // right-side account drawer
  const [activePanel, setActivePanel] = useState(null); // profile|wallet|contacts|calls|channel|group|settings
  const [editorOpen, setEditorOpen] = useState(false); // ProfileEditor modal
  const [results, setResults] = useState([]); // global user search
  const [roomResults, setRoomResults] = useState([]); // global group/channel search
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(null); // room id being joined
  const [requested, setRequested] = useState({}); // email -> true (optimistic)
  const [reqBusy, setReqBusy] = useState(null); // friend-request id being acted on
  const [profileContact, setProfileContact] = useState(null); // contact whose profile is open
  const [contactProfileOpen, setContactProfileOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    refreshContacts();
    refreshRooms();
  }, [ready, refreshContacts, refreshRooms]);

  // Close the expanded flyout on Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Debounced global search: people to add + groups/channels to join.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setRoomResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const [users, found] = await Promise.all([searchUsers(q), searchRooms(q)]);
      setResults(users);
      setRoomResults(found);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchUsers, searchRooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withoutSelf = contacts.filter((c) => c.email !== me?.email);
    const base = q
      ? withoutSelf.filter((c) =>
          `${nameOf(c)} ${c.username ?? ""} ${c.email}`.toLowerCase().includes(q),
        )
      : withoutSelf;
    return [...base].sort((a, b) => {
      const ta = a.lastMessage?.ts || 0;
      const tb = b.lastMessage?.ts || 0;
      if (ta !== tb) return tb - ta;
      return nameOf(a).localeCompare(nameOf(b));
    });
  }, [contacts, query, me?.email]);

  // Contacts and rooms share one recency-sorted list, the same way Telegram
  // mixes people and groups in a single chat feed.
  const chatItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const myRooms = q ? rooms.filter((r) => r.name.toLowerCase().includes(q)) : rooms;
    const items = [
      ...filtered.map((c) => ({
        key: `c:${c.id}`,
        kind: "contact",
        ts: c.lastMessage?.ts || 0,
        title: nameOf(c),
        data: c,
      })),
      ...myRooms.map((r) => ({
        key: `r:${r.id}`,
        kind: "room",
        ts: r.lastMessage?.ts || r.createdAt || 0,
        title: r.name,
        data: r,
      })),
    ];
    return items.sort((a, b) =>
      a.ts !== b.ts ? b.ts - a.ts : a.title.localeCompare(b.title),
    );
  }, [filtered, rooms, query]);

  // Adding is immediate and mutual on this backend, so once someone lands in
  // contacts they belong to the chat list — drop them from the search section
  // instead of showing them twice.
  const strangers = useMemo(() => {
    const known = new Set(contacts.map((c) => c.email));
    return results.filter(
      (u) => u.relation !== "friend" && !known.has(u.email) && u.email !== me?.email,
    );
  }, [results, contacts, me?.email]);

  // Rooms you're already in are in the list above — only offer the rest.
  const joinable = useMemo(() => roomResults.filter((r) => !r.isMember), [roomResults]);

  // Incoming friend requests still awaiting a response — shown inline at the top
  // of the chat list (the old right-side notification panel is gone).
  const pendingRequests = useMemo(
    () =>
      notifications.filter(
        (n) => n.type === "friend_request" && n.status === "pending",
      ),
    [notifications],
  );

  const respondRequest = async (id, fn) => {
    setReqBusy(id);
    await fn(id);
    setReqBusy(null);
  };

  // Signing out only ends THIS account: revoke its token, forget it, and hand
  // over to another stored account if there is one.
  const handleLogout = async () => {
    const email = me?.email;
    await detach();
    const next = accounts.find((a) => a.user?.email !== email);
    dispatch(accountRemoved(email));
    if (next) {
      const res = await switchAccount(next.user.email);
      if (res?.ok) {
        setAccountOpen(false);
        setActivePanel(null);
        setMenuOpen(false);
        navigate("/", { replace: true });
        return;
      }
    }
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleAddAccount = () => {
    setAccountOpen(false);
    navigate("/login?add=1");
  };

  // Leaving the open conversation behind: :contactId belongs to the account we
  // are leaving and means nothing to the next one.
  const handleSwitchAccount = async (email) => {
    const res = await switchAccount(email);
    if (res?.ok) {
      setAccountOpen(false);
      setActivePanel(null);
      navigate("/", { replace: true });
    }
    return res;
  };

  const addFriend = async (email) => {
    setRequested((r) => ({ ...r, [email]: true }));
    const res = await sendFriendRequest(email);
    if (!res?.ok) setRequested((r) => ({ ...r, [email]: false }));
  };

  const join = async (id) => {
    setJoining(id);
    const res = await joinRoom(id);
    setJoining(null);
    if (res?.ok) {
      setQuery("");
      navigate(`/room/${id}`);
    }
  };

  const openMenu = () => setMenuOpen(true);
  const closePanel = () => setActivePanel(null);
  const openContactProfile = (c) => {
    setProfileContact(c);
    setContactProfileOpen(true);
  };
  const messageContact = (c) => {
    setContactProfileOpen(false);
    setActivePanel(null);
    if (c?.id) navigate(`/chat/${c.id}`);
  };

  // Route a menu key to its panel / action. Shared by the icon rail, the
  // expanded flyout and the account drawer, so it dismisses all three.
  const handleMenu = (key) => {
    setMenuOpen(false);
    setAccountOpen(false);
    if (key === "saved") {
      if (me?.id) navigate(`/chat/${me.id}`);
      return;
    }
    setActivePanel(key);
  };

  const hasConversation = Boolean(contactId || roomId);
  const myEmail = me?.email;

  // Settings/menu entries — icons in the collapsed rail, labels when expanded.
  const menu = [
    { key: "profile", label: "My Profile", icon: <UserIcon className="h-5 w-5" /> },
    { key: "saved", label: "Saved Messages", icon: <BookmarkIcon className="h-5 w-5" /> },
    { key: "contacts", label: "Contacts", icon: <ContactsIcon className="h-5 w-5" /> },
    { key: "friends", label: "New Friend", icon: <UserPlusIcon className="h-5 w-5" />, badge: pendingRequests.length },
    { key: "calls", label: "Calls", icon: <PhoneIcon className="h-5 w-5" /> },
    { key: "group", label: "New Group", icon: <UsersIcon className="h-5 w-5" /> },
    { key: "channel", label: "New Channel", icon: <MegaphoneIcon className="h-5 w-5" /> },
    { key: "wallet", label: "Wallet", icon: <WalletIcon className="h-5 w-5" /> },
    { key: "settings", label: "Settings", icon: <SettingsIcon className="h-5 w-5" /> },
  ];

  return (
    <div
      data-theme={dark ? "dark" : "light"}
      className="relative flex h-dvh overflow-hidden text-[var(--text)]"
      style={{
        background: "var(--app-bg)",
        fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      {/* ---- Collapsed icon rail (settings/menu) — icons only ---- */}
      <nav
        className="hidden w-[68px] shrink-0 flex-col items-center gap-1 border-r border-[var(--border)] py-4 md:flex"
        style={{ background: "var(--rail-bg)", ...GLASS }}
        aria-label="Меню"
      >
        <RailButton
          icon={<MenuIcon className="h-5 w-5" />}
          label="Раскрыть меню"
          onClick={openMenu}
        />
        <div className="mt-2 flex flex-1 flex-col items-center gap-1">
          {menu.map((m) => (
            <RailButton
              key={m.key}
              icon={m.icon}
              label={m.label}
              badge={m.badge}
              active={activePanel === m.key}
              onClick={() => handleMenu(m.key)}
            />
          ))}
        </div>
        <RailButton
          icon={<MoonIcon className="h-5 w-5" />}
          label="Night Mode"
          active={dark}
          onClick={() => dispatch(toggleTheme())}
        />
        <RailButton
          icon={<LogOutIcon className="h-5 w-5" />}
          label="Выйти"
          onClick={handleLogout}
        />
      </nav>

      {/* ---- Expanded settings flyout (avatar shows only here) ---- */}
      {menuOpen && (
        <>
          <div
            className="fade-in fixed inset-0 z-40 bg-black/20"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] p-4"
            style={{
              background: "var(--flyout-bg)",
              ...GLASS,
              animation: "flyout-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            <div className="flex items-center gap-3">
              <button onClick={() => handleMenu("profile")} aria-label="Открыть профиль">
                <Avatar
                  user={me}
                  size="md"
                  tone="primary"
                  className="rounded-full ring-2 ring-[var(--ring)] transition hover:ring-[var(--ring)]"
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[15px] font-semibold">{nameOf(me)}</span>
                  {me?.verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />}
                </div>
                <div className="text-xs" style={{ color: "#34d399" }}>
                  online
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
                aria-label="Свернуть меню"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setEditorOpen(true)}
              className="mt-2 mb-3 text-left text-sm font-medium text-[var(--accent)] transition-colors hover:text-[#d8ccff]"
            >
              Change Emoji Status
            </button>

            <div className="flex-1 space-y-0.5 overflow-y-auto">
              {menu.map((m) => (
                <MenuRow
                  key={m.key}
                  icon={m.icon}
                  label={m.label}
                  badge={m.badge}
                  onClick={() => handleMenu(m.key)}
                />
              ))}
            </div>

            <div className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
              <div className="flex items-center justify-between rounded-xl px-3 py-2">
                <span className="flex items-center gap-3 text-sm">
                  <MoonIcon className="h-5 w-5 text-[var(--text-mid)]" />
                  Night Mode
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dark}
                  onClick={() => dispatch(toggleTheme())}
                  className="relative h-6 w-11 rounded-full transition-colors"
                  style={{ background: dark ? PURPLE_GRAD : "var(--switch-off)" }}
                  aria-label="Night Mode"
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                    style={{ left: dark ? "22px" : "2px" }}
                  />
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)]"
              >
                <LogOutIcon className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- Chat list column (normal messenger list) ---- */}
      <aside
        className={`${hasConversation ? "hidden" : "flex"} w-full flex-col border-r border-[var(--border)] md:flex md:w-72 lg:w-80`}
        style={{ background: "var(--surface)", ...GLASS }}
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3">
          <h1 className="text-lg font-semibold text-[var(--text-strong)]">Chats</h1>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            className="flex min-h-[44px] items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-[var(--text-mid)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          >
            <Avatar user={me} size="sm" tone="primary" className="rounded-full" />
            <span>Account</span>
          </button>
        </div>

        <div className="px-3 pb-2 pt-1">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 transition-colors focus-within:border-[#9db0f7]/60 focus-within:bg-[var(--surface-3)]">
            <SearchIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени или @username"
              className="grow bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
              aria-label="Поиск"
            />
          </label>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Чаты">
          {!contactsLoaded ? (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-sm text-[var(--text-muted)]">
              <span className="loading loading-spinner loading-md" />
              <span>Загрузка…</span>
            </div>
          ) : (
            <>
              {/* Saved Messages shortcut always available at the top */}
              {!query && (
                <button
                  onClick={() => me?.id && navigate(`/chat/${me.id}`)}
                  className="mb-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--surface-3)]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: "linear-gradient(135deg,#38bdf8,#6366f1)" }}
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--text)]">Saved Messages</div>
                    <div className="truncate text-sm text-[var(--text-muted)]">Избранное и заметки</div>
                  </div>
                </button>
              )}

              {chatItems.length > 0 && (
                <ul className="space-y-0.5">
                  {chatItems.map((item) => {
                    if (item.kind === "room") {
                      const r = item.data;
                      const Glyph = r.kind === "channel" ? MegaphoneIcon : UsersIcon;
                      return (
                        <li key={item.key}>
                          <NavLink
                            to={`/room/${r.id}`}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-xl px-2.5 py-2 transition ${
                                isActive ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--field)]"
                              }`
                            }
                          >
                            <RoomAvatar room={r} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <Glyph
                                    className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                                    aria-label={r.kind === "channel" ? "Канал" : "Группа"}
                                  />
                                  <span className="truncate font-medium text-[var(--text)]">
                                    {r.name}
                                  </span>
                                </span>
                                {r.lastMessage && (
                                  <span className="shrink-0 text-xs text-[var(--text-faint)]">
                                    {shortTime(r.lastMessage.ts)}
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-sm text-[var(--text-muted)]">
                                {r.lastMessage
                                  ? previewText(r.lastMessage, myEmail)
                                  : `${r.memberCount} ${
                                      r.kind === "channel" ? "подписчик(ов)" : "участник(ов)"
                                    }`}
                              </div>
                            </div>
                          </NavLink>
                        </li>
                      );
                    }
                    const c = item.data;
                    const sub = typing[c.email] ? (
                      <span className="text-[var(--accent)]">печатает…</span>
                    ) : c.lastMessage ? (
                      previewText(c.lastMessage, myEmail)
                    ) : c.online ? (
                      "в сети"
                    ) : (
                      lastSeenText(c.lastSeen)
                    );
                    return (
                      <li key={item.key}>
                        <NavLink
                          to={`/chat/${c.id}`}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-2.5 py-2 transition ${
                              isActive ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--field)]"
                            }`
                          }
                        >
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={`Профиль ${nameOf(c)}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openContactProfile(c);
                            }}
                            className="relative shrink-0 rounded-full transition hover:brightness-110"
                          >
                            <Avatar user={c} size="md" tone="primary" />
                            <span
                              className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[var(--dot-ring)]"
                              style={{ background: c.online ? "#34d399" : "#6f6d80" }}
                              aria-label={c.online ? "в сети" : "не в сети"}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-1">
                                <span className="truncate font-medium text-[var(--text)]">
                                  {nameOf(c)}
                                </span>
                                {c.verified && (
                                  <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />
                                )}
                              </span>
                              {c.lastMessage && (
                                <span className="shrink-0 text-xs text-[var(--text-faint)]">
                                  {shortTime(c.lastMessage.ts)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm text-[var(--text-muted)]">{sub}</span>
                              {c.unread > 0 && (
                                <span
                                  className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                                  style={{ background: "#ff5d6c" }}
                                >
                                  {c.unread > 99 ? "99+" : c.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!query && chatItems.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  <p className="font-medium text-[var(--text-mid)]">Пока нет чатов</p>
                  <p className="mt-1">
                    Найдите друзей по имени или @username в поиске выше и отправьте заявку.
                  </p>
                </div>
              )}

              {query && !searching && joinable.length > 0 && (
                <div className="mt-2">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    Группы и каналы
                  </p>
                  <ul className="space-y-0.5">
                    {joinable.map((r) => (
                      <li key={r.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
                        <RoomAvatar room={r} size="md" />
                        <div className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-1.5">
                            {r.kind === "channel" ? (
                              <MegaphoneIcon
                                className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                                aria-label="Канал"
                              />
                            ) : (
                              <UsersIcon
                                className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                                aria-label="Группа"
                              />
                            )}
                            <span className="truncate font-medium text-[var(--text)]">{r.name}</span>
                          </span>
                          <p className="truncate text-xs text-[var(--text-faint)]">
                            {r.memberCount} {r.kind === "channel" ? "подписчик(ов)" : "участник(ов)"}
                            {r.bio ? ` · ${r.bio}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => join(r.id)}
                          disabled={joining === r.id}
                          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                          style={{ background: PURPLE_GRAD }}
                        >
                          <PlusIcon className="h-4 w-4" />
                          Вступить
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {query && (
                <div className="mt-2">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    Поиск людей
                  </p>
                  {searching ? (
                    <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                      <span className="loading loading-spinner loading-sm" />
                    </div>
                  ) : strangers.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                      {chatItems.length === 0 && joinable.length === 0
                        ? "Ничего не найдено"
                        : "Больше никого не найдено"}
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {strangers.map((u) => {
                        const isRequested = requested[u.email] || u.relation === "requested";
                        return (
                          <li
                            key={u.id || u.email}
                            className="so-row flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-200 hover:bg-[var(--surface)]"
                          >
                            <Avatar user={u} size="md" tone="primary" />
                            <div className="min-w-0 flex-1">
                              <span className="flex min-w-0 items-center gap-1">
                                <span className="truncate font-medium text-[var(--text)]">
                                  {nameOf(u)}
                                </span>
                                {u.verified && (
                                  <VerifiedIcon className="h-4 w-4 shrink-0 text-sky-400" />
                                )}
                              </span>
                              <p className="truncate text-xs text-[var(--text-faint)]">
                                {u.username ? `@${u.username}` : u.email}
                              </p>
                            </div>
                            {u.relation === "incoming" ? (
                              <button
                                aria-label="Принять"
                                title="Принять"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-110 hover:brightness-110 active:scale-95"
                                style={{ background: PURPLE_GRAD }}
                                onClick={() => {
                                  const req = pendingRequests.find(
                                    (n) => n.from?.email === u.email,
                                  );
                                  if (req) respondRequest(req.id, acceptFriend);
                                }}
                              >
                                <UserCheckIcon className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                aria-label={isRequested ? "Добавлен" : "Добавить"}
                                title={isRequested ? "Добавлен" : "Добавить"}
                                disabled={isRequested}
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                  isRequested
                                    ? "scale-100 bg-[var(--surface)] text-[var(--text-muted)]"
                                    : "text-white hover:scale-110 hover:brightness-110 active:scale-95"
                                }`}
                                style={isRequested ? undefined : { background: PURPLE_GRAD }}
                                onClick={() => addFriend(u.email)}
                              >
                                {isRequested ? (
                                  <UserCheckIcon className="h-4 w-4" />
                                ) : (
                                  <UserPlusIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </nav>
      </aside>

      {/* ---- Conversation area ---- */}
      <section
        className={`${hasConversation ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}
      >
        <div className="min-h-0 flex-1">
          <Outlet context={{ openContactProfile }} />
        </div>
      </section>

      {/* ---- Left slide-over panels (open from the settings rail/menu) ---- */}
      <SlideOver open={activePanel === "profile"} onClose={closePanel} label="Профиль">
        <ProfilePanel onClose={closePanel} onEdit={() => setEditorOpen(true)} />
      </SlideOver>
      <SlideOver open={activePanel === "wallet"} onClose={closePanel} label="Кошелёк">
        <WalletPanel onClose={closePanel} />
      </SlideOver>
      <SlideOver open={activePanel === "contacts"} onClose={closePanel} label="Контакты">
        <ContactsPanel onClose={closePanel} onOpenProfile={openContactProfile} />
      </SlideOver>
      <SlideOver open={activePanel === "friends"} onClose={closePanel} label="Новые друзья">
        <FriendRequestsPanel onClose={closePanel} />
      </SlideOver>
      <SlideOver open={activePanel === "calls"} onClose={closePanel} label="Звонки">
        <CallsPanel onClose={closePanel} />
      </SlideOver>
      <SlideOver open={activePanel === "channel"} onClose={closePanel} label="Новый канал">
        <NewChannelPanel onClose={closePanel} />
      </SlideOver>
      <SlideOver open={activePanel === "group"} onClose={closePanel} label="Новая группа">
        <NewGroupPanel onClose={closePanel} />
      </SlideOver>
      <SlideOver open={activePanel === "settings"} onClose={closePanel} label="Настройки">
        <SettingsPanel
          onClose={closePanel}
          onEditProfile={() => setEditorOpen(true)}
          dark={dark}
          onToggleTheme={() => dispatch(toggleTheme())}
          onLogout={handleLogout}
        />
      </SlideOver>

      {/* ---- Right-side account drawer (opens from "Account" in the sidebar) ---- */}
      <SlideOver
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        side="right"
        label="Аккаунт"
      >
        <AccountDrawer
          onClose={() => setAccountOpen(false)}
          onSelect={handleMenu}
          dark={dark}
          onToggleTheme={() => dispatch(toggleTheme())}
          onLogout={handleLogout}
          onAddAccount={handleAddAccount}
          onSwitchAccount={handleSwitchAccount}
        />
      </SlideOver>

      <SlideOver
        open={contactProfileOpen}
        onClose={() => setContactProfileOpen(false)}
        label="Профиль контакта"
      >
        <ContactProfilePanel
          contact={profileContact}
          onClose={() => setContactProfileOpen(false)}
          onMessage={messageContact}
        />
      </SlideOver>

      <ProfileEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
