// Centralized runtime config sourced from Vite env vars (VITE_*).
// Never put secrets here — anything bundled is shipped to the browser.

// Socket.IO server URL (http/https — the client negotiates the WebSocket
// transport itself). Matches the Express + socket.io backend in /prod.
const RAW_URL = import.meta.env.VITE_SOCKET_URL || "https://chat-backend-nl2o.onrender.com/";

export const SOCKET_URL = RAW_URL;

// Same origin as the socket: the backend serves both the REST auth routes
// (/api/auth/*) and Socket.IO. Trailing slash stripped so `${API_URL}/api/...`
// never produces a double slash.
export const API_URL = RAW_URL.replace(/\/+$/, "");

// The backend authenticates sockets from handshake.auth.token and rejects an
// invalid one outright, so the token always travels in the handshake.
export const SOCKET_AUTH = true;
