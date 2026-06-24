import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

import { SOCKET_URL, SOCKET_AUTH } from "../config";

const WebSocketContext = createContext(null);

const MAX_MESSAGES = 200; // cap history to avoid unbounded memory growth

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function WebSocketProvider({ children }) {
  const token = useSelector((state) => state.auth.token);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [status, setStatus] = useState("idle"); // idle | connecting | open | closed | error
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);

  const pushMessage = useCallback((msg) => {
    setMessages((prev) => {
      const next = [...prev, { id: uid(), ts: Date.now(), ...msg }];
      return next.length > MAX_MESSAGES
        ? next.slice(next.length - MAX_MESSAGES)
        : next;
    });
  }, []);

  // Maintain a Socket.IO connection while authenticated. socket.io handles the
  // Engine.IO handshake, transport upgrade, heartbeats and auto-reconnection.
  useEffect(() => {
    if (!isAuthenticated) {
      setStatus("idle");
      return undefined;
    }

    setStatus("connecting");

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      // Token travels in the handshake payload, not the URL (keeps it out of logs).
      auth: SOCKET_AUTH && token ? { token } : undefined,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("open");
      pushMessage({ direction: "system", text: "Connected to server" });
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io client disconnect") {
        setStatus("closed"); // we called disconnect() ourselves
      } else {
        // transport dropped — socket.io is already retrying
        setStatus("connecting");
        pushMessage({ direction: "system", text: "Disconnected — reconnecting…" });
      }
    });

    socket.on("connect_error", () => {
      // fired on every failed attempt while socket.io keeps retrying
      setStatus("error");
    });

    // Backend broadcasts every "message" to all clients (including the sender).
    socket.on("message", (data) => {
      const isObject = data !== null && typeof data === "object";
      const mine = isObject && socket.id && data.senderId === socket.id;
      const text = isObject
        ? String(data.text ?? JSON.stringify(data))
        : String(data);
      // React escapes text on render, so message content can't inject markup.
      pushMessage({ direction: mine ? "out" : "in", text });
    });

    socket.connect();

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, pushMessage]);

  const sendMessage = useCallback((text) => {
    const trimmed = String(text ?? "").trim();
    const socket = socketRef.current;
    if (!trimmed || !socket || !socket.connected) return false;
    // Tag with sender id + timestamp so each client can label its own bubbles.
    socket.emit("message", {
      text: trimmed,
      senderId: socket.id,
      ts: Date.now(),
    });
    return true;
  }, []);

  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      setStatus("connecting");
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) socket.disconnect();
    setStatus("closed");
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const value = {
    status,
    messages,
    sendMessage,
    reconnect,
    disconnect,
    clearMessages,
    url: SOCKET_URL,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocket must be used within a <WebSocketProvider>");
  }
  return ctx;
}
