// Centralized runtime config sourced from Vite env vars (VITE_*).
// Never put secrets here — anything bundled is shipped to the browser.

// Socket.IO server URL (http/https — the client negotiates the WebSocket
// transport itself). Matches the Express + socket.io backend in /prod.
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// When true, send the auth token during the Socket.IO handshake
// (available as socket.handshake.auth.token on the server) instead of the URL.
export const SOCKET_AUTH = import.meta.env.VITE_WS_AUTH === "1";
