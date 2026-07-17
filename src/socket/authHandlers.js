const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// MongoDB ulanganda User modelini ishlatadi, aks holda in-memory store
const inMemoryUsers = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function findUserByEmail(email) {
  if (isDbConnected()) {
    const User = require("../models/User");
    return await User.findOne({ email: email.toLowerCase() });
  }
  return inMemoryUsers.find((u) => u.email === email.toLowerCase()) || null;
}

async function createUser(data) {
  if (isDbConnected()) {
    const User = require("../models/User");
    return await User.create(data);
  }
  const user = {
    _id: Date.now().toString(),
    ...data,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
  };
  inMemoryUsers.push(user);
  return user;
}

module.exports = function registerAuthHandlers(socket) {
  socket.on("register", async ({ firstName, lastName, age, email, password }) => {
    try {
      if (!firstName || !lastName || !age || !email || !password) {
        return socket.emit("register_response", {
          success: false,
          message: "Barcha maydonlar to'ldirilishi shart!",
        });
      }

      const exists = await findUserByEmail(email);
      if (exists) {
        return socket.emit("register_response", {
          success: false,
          message: "Bu email allaqachon ro'yxatdan o'tgan!",
        });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await createUser({
        firstName,
        lastName,
        age: Number(age),
        email: email.toLowerCase(),
        password: hashed,
      });

      socket.emit("register_response", {
        success: true,
        message: "Ro'yxatdan o'tish muvaffaqiyatli!",
        user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      });
    } catch (err) {
      socket.emit("register_response", {
        success: false,
        message: "Server xatosi: " + err.message,
      });
    }
  });

  socket.on("login", async ({ email, password }) => {
    try {
      if (!email || !password) {
        return socket.emit("login_response", {
          success: false,
          message: "Email va parol kiritilishi shart!",
        });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return socket.emit("login_response", {
          success: false,
          message: "Bu email ro'yxatdan o'tmagan!",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return socket.emit("login_response", {
          success: false,
          message: "Parol noto'g'ri!",
        });
      }

      socket.emit("login_response", {
        success: true,
        message: `Xush kelibsiz, ${user.firstName} ${user.lastName}!`,
        user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      });
    } catch (err) {
      socket.emit("login_response", {
        success: false,
        message: "Server xatosi: " + err.message,
      });
    }
  });
};
