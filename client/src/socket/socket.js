import { io } from "socket.io-client";

// Dev rejimda alohida backend (5000), production build'da esa o'sha origin'ning o'zi
const URL = import.meta.env.DEV ? "http://localhost:5000" : "/";

const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
