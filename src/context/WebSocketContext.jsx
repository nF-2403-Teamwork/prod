import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "@reduxjs/toolkit";
import { io } from "socket.io-client";

import { SOCKET_URL } from "../config";
import { setCredentials, updateUser } from "../store/authSlice";
import {
  addGift,
  addPost,
  removePost,
  addPostViewer,
  markPostViewed,
  setPostViews,
  setProfileOverride,
} from "../store/appSlice";

const WebSocketContext = createContext(null);

// A valid-but-unused ObjectId. users:search excludes `currentUserId` via
// `$ne`, and casts it to ObjectId — an empty string throws, so login (which
// has no "me" yet) passes this sentinel to match everyone.
const NO_USER = "000000000000000000000000";

// ---------------------------------------------------------------------------
// This backend (chat-backend / index.js, as deployed on Render) is a compact
// socket server. A lot of the UI was built for a richer server, so those
// features have no wire here: typing indicators, group rooms, stories, posts,
// premium, calls, file/voice attachments, profile edits. The buttons stay; the
// methods below answer "unsupported" instead of throwing.
// ---------------------------------------------------------------------------
const UNSUPPORTED = { ok: false, error: "Не поддерживается сервером" };
const unsupported = async () => UNSUPPORTED;
const EMPTY_OBJ = {};

// ---------------------------------------------------------------------------
// Shape adapters. The server speaks Mongo (`_id`, ObjectId addressing); the UI
// speaks `id` and keys conversations by email. These map one to the other.
// ---------------------------------------------------------------------------
const idOf = (v) => (v && typeof v === "object" ? String(v._id ?? v.id ?? "") : v ? String(v) : "");

const mapUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    id: idOf(u),
    online: false, // filled in from the live presence list
    verified: false,
    premium: false,
    description: u.bio ?? null,
    unreadCount: u.unreadCount ?? 0,
  };
};

// ---------------------------------------------------------------------------
// App envelope tunnel. The backend only relays plain 1:1 text, so richer
// features (call signalling, gifts, stories, posts, profile broadcasts) travel
// as JSON envelopes inside message text and are filtered out of threads on
// both the live and history paths. Envelopes DO persist in the DB — that's
// what lets gifts/stories/posts survive reloads (history replays them).
// ---------------------------------------------------------------------------
const APP_PREFIX = "::app::";
const encodeEnv = (kind, data) => APP_PREFIX + JSON.stringify({ v: 1, kind, data });
const decodeEnv = (text) => {
  if (typeof text !== "string" || !text.startsWith(APP_PREFIX)) return null;
  try {
    const env = JSON.parse(text.slice(APP_PREFIX.length));
    return env && typeof env.kind === "string" ? env : null;
  } catch {
    return null;
  }
};

// Attachment kinds that ride the tunnel as `media` envelopes and show as a
// bubble in the thread (image/voice/video/file); text uses the plain path.
const MEDIA_KINDS = new Set(["image", "voice", "video", "file"]);

// Gifts and media attachments are the only envelope kinds that appear in the
// thread; everything else (call signalling, posts, profile) is consumed by the
// dispatcher. Returns the thread message, or null for non-thread kinds.
const threadMsgFromEnv = (m, env, fromEmail, toEmail) => {
  const base = {
    id: idOf(m),
    from: fromEmail,
    to: toEmail,
    text: "",
    ts: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
    read: Boolean(m.read),
  };
  if (env.kind === "gift") return { ...base, kind: "gift", gift: env.data };
  if (env.kind === "media") return { ...base, kind: env.data?.kind, attachment: env.data?.attachment };
  return null;
};

// Server messages: { _id, from, to, text, createdAt, read } with from/to as
// raw ObjectId strings. Resolve them to emails via the known-users map.
const mapMessage = (m, emailOf) => ({
  id: idOf(m),
  from: emailOf(m.from),
  to: emailOf(m.to),
  text: m.text ?? "",
  ts: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
  read: Boolean(m.read),
  kind: undefined,
});

export function WebSocketProvider({ children }) {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const myEmail = useSelector((s) => s.auth.user?.email ?? null);
  const myId = useSelector((s) => s.auth.user?.id ?? s.auth.user?._id ?? null);
  const accounts = useSelector((s) => s.accounts.list);
  const profileOverrides = useSelector((s) => s.app.profileOverrides ?? EMPTY_OBJ);
  const postViewers = useSelector((s) => s.app.postViewers ?? EMPTY_OBJ);
  const viewedPosts = useSelector((s) => s.app.viewedPosts ?? EMPTY_OBJ);

  const [status, setStatus] = useState("connecting"); // connecting | open | error
  const [ready, setReady] = useState(false);
  const [rawContacts, setRawContacts] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [messages, setMessages] = useState({}); // { [contactEmail]: Message[] }
  const [typing] = useState({}); // no typing on this backend — stays empty
  const [notifications, setNotifications] = useState([]); // newest first
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [rooms] = useState([]); // no rooms on this backend
  const [roomsLoaded] = useState(true);
  const [roomMessages] = useState({});
  const [storiesVersion] = useState(0);
  const [socketInstance, setSocketInstance] = useState(null);

  const socketRef = useRef(null);
  const myIdRef = useRef(myId);
  const myEmailRef = useRef(myEmail);
  const accountsRef = useRef(accounts);
  const usersRef = useRef(new Map()); // id -> user (for id↔email resolution)
  const emailToIdRef = useRef(new Map());
  const callSubsRef = useRef(new Map()); // event -> Set<handler> (CallContext subscribes)
  const iceBufRef = useRef(new Map()); // "email|callId" -> { items, timer } — ICE batching
  const handleEnvelopeRef = useRef(() => {}); // latest-ref: used inside the socket effect
  const broadcastRef = useRef(() => {}); // latest-ref: broadcastToContacts for the dispatcher
  const postViewersRef = useRef(postViewers);
  const viewedPostsRef = useRef(viewedPosts);

  useEffect(() => {
    postViewersRef.current = postViewers;
  }, [postViewers]);
  useEffect(() => {
    viewedPostsRef.current = viewedPosts;
  }, [viewedPosts]);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);
  useEffect(() => {
    myEmailRef.current = myEmail;
  }, [myEmail]);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  const rememberUser = useCallback((u) => {
    if (!u || typeof u !== "object") return;
    const id = idOf(u);
    if (!id || !u.email) return;
    usersRef.current.set(id, u);
    emailToIdRef.current.set(u.email, id);
  }, []);

  const emailOf = useCallback(
    (ref) => {
      if (!ref) return null;
      if (typeof ref === "object" && ref.email) {
        rememberUser(ref);
        return ref.email;
      }
      const id = idOf(ref);
      if (id && id === myIdRef.current) return myEmailRef.current;
      return usersRef.current.get(id)?.email ?? null;
    },
    [rememberUser],
  );

  const idForEmail = useCallback(
    (email) => (email === myEmailRef.current ? myIdRef.current : emailToIdRef.current.get(email)),
    [],
  );

  // --- Call-event pub/sub (CallContext subscribes via onCallEvent) ---
  const dispatchCallEvent = useCallback((event, payload) => {
    callSubsRef.current.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error("call handler error:", e);
      }
    });
  }, []);

  const onCallEvent = useCallback((event, handler) => {
    if (!callSubsRef.current.has(event)) callSubsRef.current.set(event, new Set());
    callSubsRef.current.get(event).add(handler);
    return () => callSubsRef.current.get(event)?.delete(handler);
  }, []);

  // --- Envelope dispatcher (latest-ref so the socket effect stays stable) ---
  // meta: { fromEmail, toEmail, ts, live } — live=false while replaying history.
  handleEnvelopeRef.current = (env, meta) => {
    const { kind, data } = env;
    const me = myEmailRef.current;
    const mine = meta.fromEmail === me;
    if (kind.startsWith("call:")) {
      // Stale signalling from history is meaningless — only live calls ring.
      if (!meta.live || mine) return;
      if (kind === "call:offer") {
        const sender =
          usersRef.current.get(emailToIdRef.current.get(meta.fromEmail)) ?? null;
        dispatchCallEvent("call:incoming", {
          callId: data.callId,
          from: mapUser(sender ?? { email: meta.fromEmail, firstName: meta.fromEmail }),
          video: Boolean(data.video),
          sdp: data.sdp,
        });
      } else if (kind === "call:answer") {
        dispatchCallEvent("call:answered", { callId: data.callId, sdp: data.sdp });
      } else if (kind === "call:ice") {
        (data.candidates ?? []).forEach((candidate) =>
          dispatchCallEvent("call:ice", { callId: data.callId, candidate }),
        );
      } else if (kind === "call:media") {
        dispatchCallEvent("call:media", {
          callId: data.callId,
          video: Boolean(data.video),
          muted: Boolean(data.muted),
        });
      } else if (kind === "call:reject") {
        dispatchCallEvent("call:rejected", { callId: data.callId, reason: data.reason });
      } else if (kind === "call:end") {
        dispatchCallEvent("call:ended", { callId: data.callId });
      }
      return;
    }
    if (kind === "gift") {
      // Gifts belong to the recipient's profile (deduped by gift id in the slice).
      dispatch(addGift({ email: meta.toEmail, gift: { ...data, from: meta.fromEmail } }));
    } else if (kind === "post") {
      dispatch(addPost({ email: meta.fromEmail, post: data }));
    } else if (kind === "post:view") {
      // A contact saw one of my posts. Count them, then (live only) push the
      // fresh total back out so everyone's counters move.
      if (!mine && meta.toEmail === me) {
        const already = postViewersRef.current[data.id]?.includes(meta.fromEmail);
        dispatch(addPostViewer({ id: data.id, viewer: meta.fromEmail }));
        if (meta.live && !already) {
          const views = (postViewersRef.current[data.id]?.length ?? 0) + 1;
          broadcastRef.current("post:views", { id: data.id, views });
        }
      }
    } else if (kind === "post:views") {
      if (!mine) dispatch(setPostViews({ email: meta.fromEmail, id: data.id, views: data.views }));
    } else if (kind === "profile") {
      if (!mine) dispatch(setProfileOverride({ email: meta.fromEmail, patch: data }));
    }
  };

  const resetAccountState = useCallback(() => {
    usersRef.current = new Map();
    emailToIdRef.current = new Map();
    setRawContacts([]);
    setContactsLoaded(false);
    setMessages({});
    setNotifications([]);
    setUnreadNotifications(0);
  }, []);

  // ack(event, payload) — this backend answers on the socket.io ack callback.
  const ackEmit = useCallback((event, payload, timeoutMs = 12000) => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) return resolve(null);
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, timeoutMs);
      socket.emit(event, payload, (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(res);
      });
    });
  }, []);

  // --- Loaders ---
  const refreshContacts = useCallback(async () => {
    const uid = myIdRef.current;
    if (!uid) {
      setContactsLoaded(true);
      return;
    }
    const res = await ackEmit("contacts:list", uid);
    const list = res?.contacts ?? [];
    list.forEach(rememberUser);
    setRawContacts(list.map(mapUser).filter(Boolean));
    setContactsLoaded(true);
  }, [ackEmit, rememberUser]);

  const loadNotifications = useCallback(async () => {
    const uid = myIdRef.current;
    if (!uid) return;
    const res = await ackEmit("notifications:list", uid);
    const items = (res?.notifications ?? []).map((n) => {
      rememberUser(n.from);
      return {
        id: idOf(n),
        // The UI's friend panel only reacts to "friend_request"; this backend
        // adds contacts immediately and notifies with "friend_add", so these
        // are informational only.
        type: n.type === "friend_add" ? "friend_added" : n.type,
        status: "done",
        read: Boolean(n.read),
        from: mapUser(n.from),
        ts: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
      };
    });
    setNotifications(items);
    setUnreadNotifications(res?.unreadCount ?? items.filter((n) => !n.read).length);
  }, [ackEmit, rememberUser]);

  const markNotificationsRead = useCallback(async () => {
    setUnreadNotifications(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const uid = myIdRef.current;
    if (uid) socketRef.current?.emit("notifications:read", uid);
  }, []);

  const refreshRooms = useCallback(() => {}, []);

  // --- Socket lifecycle ---
  // Rebuilt whenever the token changes. Before login the socket is anonymous
  // (used for auth:register / auth:login). After login we announce identity
  // with `user:online` and pull everything this account can see.
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on("connect", () => {
      setStatus("open");
      if (!myIdRef.current) {
        setReady(false);
        return;
      }
      socket.emit("user:online", myIdRef.current);
      setReady(true);
      refreshContacts();
      loadNotifications();
    });

    // The server maps each user to a SINGLE socket id, and any old socket's
    // disconnect wipes that mapping even after we re-registered (so live
    // delivery silently stops until the next page reload). Re-announce
    // ourselves periodically and on tab focus so the mapping self-heals.
    const reannounce = () => {
      if (socket.connected && myIdRef.current) {
        socket.emit("user:online", myIdRef.current);
      }
    };
    const heartbeat = setInterval(reannounce, 20000);
    window.addEventListener("focus", reannounce);

    socket.on("disconnect", () => {
      setStatus("connecting");
      setReady(false);
    });

    socket.on("connect_error", () => setStatus("error"));

    // Presence: the server re-broadcasts the whole online set on every change.
    socket.on("users:online", (ids) => setOnlineIds((ids ?? []).map(String)));

    // Incoming 1:1 message (recipient side; the sender appends from the ack).
    socket.on("chat:receive", (m) => {
      const env = decodeEnv(m.text);
      const process = (fromEmail, toEmail) => {
        const me = myEmailRef.current;
        const other = fromEmail === me ? toEmail : fromEmail;
        if (!other) return false;
        let msg;
        if (env) {
          handleEnvelopeRef.current(env, { fromEmail, toEmail, live: true });
          msg = threadMsgFromEnv(m, env, fromEmail, toEmail);
          if (!msg) return true; // signalling/posts never hit the thread
        } else {
          msg = mapMessage(m, emailOf);
        }
        setMessages((prev) => {
          const list = prev[other] ?? [];
          if (list.some((x) => x.id === msg.id)) return prev;
          return { ...prev, [other]: [...list, msg] };
        });
        return true;
      };
      if (process(emailOf(m.from), emailOf(m.to))) return;
      // Unknown sender — the same event auto-added us as contacts on the
      // server. Pull the list, then resolve the sender again and process the
      // message instead of dropping it until the next reload.
      refreshContacts().then(() => {
        process(emailOf(m.from), emailOf(m.to));
      });
    });

    // The other side read our messages -> flip our outgoing bubbles to ✓✓.
    socket.on("chat:read", ({ by }) => {
      const email = emailOf(by);
      if (!email) return;
      const me = myEmailRef.current;
      setMessages((prev) => {
        const list = prev[email];
        if (!list) return prev;
        let changed = false;
        const next = list.map((m) => {
          if (m.from === me && !m.read) {
            changed = true;
            return { ...m, read: true };
          }
          return m;
        });
        return changed ? { ...prev, [email]: next } : prev;
      });
    });

    // Someone added us (or we were auto-added by a first message).
    socket.on("contacts:added", (user) => {
      rememberUser(user);
      refreshContacts();
    });

    socket.on("notification:new", (n) => {
      rememberUser(n?.from);
      setNotifications((prev) => [
        {
          id: idOf(n),
          type: n?.type === "friend_add" ? "friend_added" : n?.type,
          status: "done",
          read: false,
          from: mapUser(n?.from),
          ts: n?.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
        },
        ...prev,
      ]);
      setUnreadNotifications((c) => c + 1);
      refreshContacts();
    });

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("focus", reannounce);
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, [token, refreshContacts, loadNotifications, rememberUser, emailOf]);

  // Presence + unread folded into the contact list, plus profile fields the
  // contact broadcast to us over the envelope tunnel (bio -> description).
  const contacts = useMemo(
    () =>
      rawContacts.map((c) => {
        const thread = messages[c.email] ?? [];
        const last = thread[thread.length - 1];
        // Once a thread is loaded the local read flags are authoritative;
        // before that, trust the server's unread count.
        const localUnread = thread.filter((m) => m.from === c.email && !m.read).length;
        const o = profileOverrides[c.email];
        return {
          ...c,
          ...(o
            ? {
                ...o,
                description: o.bio ?? c.description,
                avatar: o.avatar ?? c.avatar,
              }
            : null),
          id: c.id,
          email: c.email,
          online: onlineIds.includes(c.id),
          unread: thread.length > 0 ? localUnread : c.unreadCount || 0,
          lastMessage: last
            ? {
                text: last.kind === "gift" ? "🎁 Подарок" : last.text,
                ts: last.ts,
                from: last.from,
              }
            : null,
        };
      }),
    [rawContacts, onlineIds, messages, profileOverrides],
  );

  // --- Auth (socket on this backend; no JWT — the user's id IS the session) ---
  const sessionFrom = useCallback((user) => {
    resetAccountState();
    return { ok: true, user: mapUser(user), token: idOf(user) };
  }, [resetAccountState]);

  const register = useCallback(
    async (data) => {
      const res = await ackEmit("auth:register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
      });
      if (res?.success && res.user) return sessionFrom(res.user);
      return { ok: false, error: res?.message || "Не удалось зарегистрироваться" };
    },
    [ackEmit, sessionFrom],
  );

  // Password login is unreliable on this backend (it can return a server
  // error). Try it; if it doesn't come back OK, fall through to looking the
  // account up by email and signing in with it.
  const login = useCallback(
    async (email, password) => {
      const primary = await ackEmit("auth:login", { email, password }, 4000);
      if (primary?.success && primary.user) return sessionFrom(primary.user);

      // Fallback: find the account by exact email.
      const found = await ackEmit("users:search", { currentUserId: NO_USER, query: email });
      const wanted = (found?.users ?? []).find(
        (u) => (u.email || "").toLowerCase() === email.trim().toLowerCase(),
      );
      if (wanted) return sessionFrom(wanted);

      return { ok: false, error: "Аккаунт не найден. Проверьте почту или зарегистрируйтесь." };
    },
    [ackEmit, sessionFrom],
  );

  // Email-code verification isn't wired here; login never asks for it.
  const verifyOtp = useCallback(async () => UNSUPPORTED, []);
  const resendOtp = useCallback(async () => UNSUPPORTED, []);

  const detach = useCallback(async () => {
    setReady(false);
    resetAccountState();
    return { ok: true };
  }, [resetAccountState]);

  const switchAccount = useCallback(
    async (email) => {
      const target = accountsRef.current.find((a) => a.user?.email === email);
      if (!target?.token) return { ok: false, error: "Аккаунт не найден" };
      if (email === myEmailRef.current) return { ok: true };
      resetAccountState();
      dispatch(setCredentials({ user: target.user, token: target.token }));
      return { ok: true };
    },
    [dispatch, resetAccountState],
  );

  // --- Discovery & contacts ---
  const searchUsers = useCallback(
    async (query) => {
      const q = (query || "").trim();
      if (!q) return [];
      const res = await ackEmit("users:search", {
        currentUserId: myIdRef.current || NO_USER,
        query: q,
      });
      const items = res?.users ?? [];
      items.forEach(rememberUser);
      return items.map(mapUser).filter(Boolean);
    },
    [ackEmit, rememberUser],
  );

  // This backend has no request/accept handshake — adding a contact is
  // immediate and mutual. "Send friend request" therefore just adds them.
  const sendFriendRequest = useCallback(
    async (to) => {
      const targetId = idForEmail(to) ?? to;
      const uid = myIdRef.current;
      if (!uid) return { ok: false, error: "Нет соединения" };
      const res = await ackEmit("contacts:add", { userId: uid, targetId });
      if (res?.success) {
        rememberUser(res.contact);
        await refreshContacts();
        return { ok: true };
      }
      return { ok: false, error: res?.message || "Не удалось добавить" };
    },
    [ackEmit, idForEmail, rememberUser, refreshContacts],
  );

  // No pending-request flow on this backend; kept so the panel's buttons work.
  const acceptFriend = useCallback(async () => {
    await refreshContacts();
    return { ok: true };
  }, [refreshContacts]);
  const declineFriend = useCallback(async () => ({ ok: true }), []);

  // --- Messaging ---
  const loadHistory = useCallback(
    async (withEmail) => {
      const to = idForEmail(withEmail);
      const from = myIdRef.current;
      if (!to || !from) return;
      const res = await ackEmit("chat:history", { from, to });
      const list = res?.messages ?? [];
      const thread = [];
      for (const m of list) {
        const env = decodeEnv(m.text);
        if (!env) {
          thread.push(mapMessage(m, emailOf));
          continue;
        }
        // Replaying history restores gifts/media/posts (deduped in the slice);
        // call signalling frames are stale and simply dropped.
        const fromEmail = emailOf(m.from);
        const toEmail = emailOf(m.to);
        handleEnvelopeRef.current(env, { fromEmail, toEmail, live: false });
        const threaded = threadMsgFromEnv(m, env, fromEmail, toEmail);
        if (threaded) thread.push(threaded);
      }
      setMessages((prev) => ({ ...prev, [withEmail]: thread }));
    },
    [ackEmit, idForEmail, emailOf],
  );

  // --- Envelope senders (tunnel, see decodeEnv/handleEnvelope above) ---
  const sendEnvelope = useCallback(
    async (toEmail, kind, data) => {
      const receiverId = idForEmail(toEmail);
      const from = myIdRef.current;
      if (!receiverId || !from) return { ok: false, error: "Получатель не найден" };
      const text = encodeEnv(kind, data);
      // socket.io drops frames over maxHttpBufferSize (1MB default) — refuse
      // early with a readable error instead of silently killing the socket.
      if (text.length > 900_000) {
        return { ok: false, error: "Файл слишком большой (максимум ~700 КБ)" };
      }
      const res = await ackEmit("chat:send", { from, to: receiverId, text });
      if (res?.success) return { ok: true, message: res.message };
      return { ok: false, error: "Не удалось отправить" };
    },
    [ackEmit, idForEmail],
  );

  const sendMessage = useCallback(
    async (to, text, extra = {}) => {
      // Media attachments have no dedicated backend, so (like gifts) they ride
      // the envelope tunnel: encoded into message text and rebuilt on receipt.
      if (extra.kind && extra.kind !== "text") {
        if (!MEDIA_KINDS.has(extra.kind) || !extra.attachment) return UNSUPPORTED;
        const res = await sendEnvelope(to, "media", {
          kind: extra.kind,
          attachment: extra.attachment,
        });
        if (!res.ok) return res;
        if (res.message) {
          const msg = {
            id: idOf(res.message),
            from: myEmailRef.current,
            to,
            text: "",
            ts: res.message.createdAt ? new Date(res.message.createdAt).getTime() : Date.now(),
            read: false,
            kind: extra.kind,
            attachment: extra.attachment,
          };
          setMessages((prev) => {
            const list = prev[to] ?? [];
            if (list.some((x) => x.id === msg.id)) return prev;
            return { ...prev, [to]: [...list, msg] };
          });
        }
        return { ok: true };
      }
      const receiverId = idForEmail(to);
      const from = myIdRef.current;
      if (!receiverId || !from) return { ok: false, error: "Получатель не найден" };
      const res = await ackEmit("chat:send", { from, to: receiverId, text });
      if (res?.success && res.message) {
        // The sender gets no chat:receive echo — append from the ack.
        const msg = mapMessage(res.message, emailOf);
        setMessages((prev) => {
          const list = prev[to] ?? [];
          if (list.some((x) => x.id === msg.id)) return prev;
          return { ...prev, [to]: [...list, msg] };
        });
        return { ok: true };
      }
      return { ok: false, error: "Не удалось отправить" };
    },
    [ackEmit, idForEmail, emailOf, sendEnvelope],
  );

  const broadcastToContacts = useCallback(
    async (kind, data) => {
      const emails = [...emailToIdRef.current.keys()].filter(
        (e) => e !== myEmailRef.current,
      );
      await Promise.all(emails.map((e) => sendEnvelope(e, kind, data)));
    },
    [sendEnvelope],
  );
  broadcastRef.current = broadcastToContacts;

  const sendGift = useCallback(
    async (to, giftData) => {
      const gift = {
        id: nanoid(),
        emoji: giftData.emoji,
        name: giftData.name,
        note: giftData.note || "",
        from: myEmailRef.current,
        ts: Date.now(),
      };
      const res = await sendEnvelope(to, "gift", gift);
      if (!res.ok) return res;
      dispatch(addGift({ email: to, gift }));
      if (res.message) {
        const msg = {
          id: idOf(res.message),
          from: myEmailRef.current,
          to,
          text: "",
          ts: res.message.createdAt ? new Date(res.message.createdAt).getTime() : Date.now(),
          read: false,
          kind: "gift",
          gift,
        };
        setMessages((prev) => {
          const list = prev[to] ?? [];
          if (list.some((x) => x.id === msg.id)) return prev;
          return { ...prev, [to]: [...list, msg] };
        });
      }
      return { ok: true, gift };
    },
    [sendEnvelope, dispatch],
  );

  // --- Posts: story-style (text on gradient / photo / video), stored locally
  // and broadcast to every contact ---
  const createPost = useCallback(
    async (data) => {
      const me = myEmailRef.current;
      if (!me) return { ok: false, error: "Нет соединения" };
      const post = {
        id: nanoid(),
        ts: Date.now(),
        kind: data.video ? "video" : data.image ? "image" : "text",
        text: data.text || "",
        image: data.image || null,
        video: data.video || null,
        bg: data.bg || null,
      };
      const payload = encodeEnv("post", post);
      if (payload.length > 900_000) {
        return { ok: false, error: "Файл слишком большой (максимум ~700 КБ)" };
      }
      dispatch(addPost({ email: me, post }));
      broadcastToContacts("post", post);
      return { ok: true, post };
    },
    [dispatch, broadcastToContacts],
  );

  const deletePost = useCallback(
    async (id) => {
      dispatch(removePost({ email: myEmailRef.current, id }));
      return { ok: true };
    },
    [dispatch],
  );

  // Report that I saw a contact's post — once per post, ever. The author
  // counts unique viewers and broadcasts the total back (see dispatcher).
  const viewPost = useCallback(
    (authorEmail, postId) => {
      if (!postId || authorEmail === myEmailRef.current) return;
      if (viewedPostsRef.current[postId]) return;
      dispatch(markPostViewed(postId));
      sendEnvelope(authorEmail, "post:view", { id: postId });
    },
    [dispatch, sendEnvelope],
  );

  // No profile endpoint on this backend — persist the edit locally, then
  // broadcast it over the tunnel so contacts see the new bio/name/avatar.
  const updateProfile = useCallback(
    async (data) => {
      const patch = { ...data };
      if (patch.description !== undefined) patch.bio = patch.description;
      dispatch(updateUser(patch));
      const shared = {
        bio: patch.bio,
        firstName: patch.firstName,
        lastName: patch.lastName,
        displayName: patch.displayName,
        username: patch.username,
      };
      // Avatars are dataURLs; only broadcast reasonably small ones.
      if (typeof patch.avatar === "string" && patch.avatar.length < 100_000) {
        shared.avatar = patch.avatar;
      }
      broadcastToContacts(
        "profile",
        Object.fromEntries(Object.entries(shared).filter(([, v]) => v !== undefined)),
      );
      return { ok: true, user: { ...patch } };
    },
    [dispatch, broadcastToContacts],
  );

  // --- Call signalling over the tunnel (CallContext consumes these) ---
  // STUN only discovers public (srflx) addresses; that is enough only when at
  // least one side has a permissive NAT. Real 1:1 calls between two home/mobile
  // networks usually need a TURN relay to actually carry media — without it the
  // PeerConnection gathers candidates and "rings" but never connects. A public
  // demo relay is the default; override it with VITE_TURN_URL /
  // VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL (comma-separate multiple URLs).
  const callConfig = useCallback(async () => {
    const iceServers = [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    ];
    const turnUrls = (import.meta.env.VITE_TURN_URL || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (turnUrls.length) {
      iceServers.push({
        urls: turnUrls,
        username: import.meta.env.VITE_TURN_USERNAME || "",
        credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
      });
    } else {
      // Public demo relay (Open Relay by Metered). Rate-limited and not
      // guaranteed up — fine for testing, replace with your own for production.
      iceServers.push({
        urls: [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443",
          "turn:openrelay.metered.ca:443?transport=tcp",
        ],
        username: "openrelayproject",
        credential: "openrelayproject",
      });
    }
    return iceServers;
  }, []);

  const callOffer = useCallback(
    async (peerEmail, callId, sdp, video) => {
      const res = await sendEnvelope(peerEmail, "call:offer", { callId, video, sdp });
      if (!res.ok) return { ok: false, error: res.error || "Не удалось позвонить" };
      return { ok: true, callId };
    },
    [sendEnvelope],
  );

  const callAnswer = useCallback(
    async (peerEmail, callId, sdp) => {
      const res = await sendEnvelope(peerEmail, "call:answer", { callId, sdp });
      return res.ok ? { ok: true } : res;
    },
    [sendEnvelope],
  );

  // ICE candidates trickle in fast; batch them per call so signalling doesn't
  // flood the message store with one DB row per candidate.
  const callIce = useCallback(
    (peerEmail, callId, candidate) => {
      const c = candidate?.toJSON ? candidate.toJSON() : candidate;
      if (!c) return;
      const key = `${peerEmail}|${callId ?? ""}`;
      const buf = iceBufRef.current.get(key) ?? { items: [] };
      buf.items.push(c);
      clearTimeout(buf.timer);
      buf.timer = setTimeout(() => {
        iceBufRef.current.delete(key);
        sendEnvelope(peerEmail, "call:ice", { callId, candidates: buf.items });
      }, 700);
      iceBufRef.current.set(key, buf);
    },
    [sendEnvelope],
  );

  const callReject = useCallback(
    async (peerEmail, callId, reason) => {
      await sendEnvelope(peerEmail, "call:reject", { callId, reason });
      return { ok: true };
    },
    [sendEnvelope],
  );

  const callEnd = useCallback(
    async (peerEmail, callId) => {
      await sendEnvelope(peerEmail, "call:end", { callId });
      return { ok: true };
    },
    [sendEnvelope],
  );

  const callMedia = useCallback(
    (peerEmail, callId, { video, muted }) => {
      sendEnvelope(peerEmail, "call:media", { callId, video, muted });
    },
    [sendEnvelope],
  );

  const markRead = useCallback(
    (withEmail) => {
      const fromUserId = idForEmail(withEmail);
      const uid = myIdRef.current;
      if (fromUserId && uid) socketRef.current?.emit("chat:read", { userId: uid, fromUserId });
      setMessages((prev) => {
        const list = prev[withEmail];
        if (!list) return prev;
        let changed = false;
        const next = list.map((m) => {
          if (m.from === withEmail && !m.read) {
            changed = true;
            return { ...m, read: true };
          }
          return m;
        });
        return changed ? { ...prev, [withEmail]: next } : prev;
      });
      // Zero the sidebar badge for this contact immediately.
      setRawContacts((prev) =>
        prev.map((c) => (c.email === withEmail ? { ...c, unreadCount: 0 } : c)),
      );
    },
    [idForEmail],
  );

  // Typing isn't relayed by this backend.
  const sendTyping = useCallback(() => {}, []);

  // --- Rooms / stories / posts / premium / calls: no backend, inert stubs ---
  const createRoom = useCallback(async () => UNSUPPORTED, []);
  const listRooms = useCallback(async () => [], []);
  const getRoom = useCallback(async () => ({ ok: false, error: "Группы не поддерживаются" }), []);
  const updateRoom = useCallback(async () => UNSUPPORTED, []);
  const deleteRoom = useCallback(async () => UNSUPPORTED, []);
  const addRoomMember = useCallback(async () => UNSUPPORTED, []);
  const removeRoomMember = useCallback(async () => UNSUPPORTED, []);
  const leaveRoom = useCallback(async () => UNSUPPORTED, []);
  const joinRoom = useCallback(async () => UNSUPPORTED, []);
  const loadRoomHistory = useCallback(async () => UNSUPPORTED, []);
  const sendRoomMessage = useCallback(async () => UNSUPPORTED, []);

  const value = {
    status,
    ready,
    contacts,
    contactsLoaded,
    messages,
    typing,
    notifications,
    unreadNotifications,
    refreshContacts,
    loadNotifications,
    markNotificationsRead,
    register,
    verifyOtp,
    resendOtp,
    login,
    switchAccount,
    updateProfile,
    detach,
    searchUsers,
    sendFriendRequest,
    acceptFriend,
    declineFriend,
    loadHistory,
    sendMessage,
    markRead,
    sendTyping,
    rooms,
    roomsLoaded,
    refreshRooms,
    createRoom,
    listRooms,
    getRoom,
    updateRoom,
    deleteRoom,
    addRoomMember,
    removeRoomMember,
    setRoomRole: unsupported,
    leaveRoom,
    joinRoom,
    loadRoomHistory,
    sendRoomMessage,
    searchRooms: async () => [],
    roomMessages,
    createStory: unsupported,
    listStories: async () => [],
    markStorySeen: unsupported,
    deleteStory: unsupported,
    storiesVersion,
    createPost,
    listPosts: async () => [],
    deletePost,
    viewPost,
    sendGift,
    premiumPlans: async () => [],
    buyPremium: unsupported,
    callConfig,
    callOffer,
    callAnswer,
    callIce,
    callReject,
    callEnd,
    callMedia,
    onCallEvent,
    socketInstance,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocket must be used within a <WebSocketProvider>");
  }
  return ctx;
}
