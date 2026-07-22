const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const registerAuthHandlers = require("./socket/authHandlers");
const registerChatHandlers = require("./socket/chatHandlers");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb+srv://Bekzod:6862442@cluster0.vssewsn.mongodb.net/chats?appName=Cluster0")
  .then(() => console.log("MongoDB ulandi"))
  .catch((err) => console.error("MongoDB xatosi:", err));

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Client login/reconnect bo'lganda o'z userId sini yuboradi
  socket.on("register_user", ({ userId }) => {
    if (userId) {
      socket.userId = String(userId);
      onlineUsers.set(String(userId), socket.id);
    }
  });

  registerAuthHandlers(socket);
  registerChatHandlers(socket, io, onlineUsers);

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    onlineUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
      }
    });
  });
});

// Frontend build (client/dist) ni shu serverdan berish — bitta localhost
const distPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
