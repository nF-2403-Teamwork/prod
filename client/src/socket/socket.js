import { io } from "socket.io-client";

const URL = "https://chat-backend-nl2o.onrender.com/";

const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
