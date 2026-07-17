const User = require("../models/User");
const Friendship = require("../models/Friendship");
const Message = require("../models/Message");

module.exports = function registerChatHandlers(socket, io, onlineUsers) {
  // search_user: search by email (partial, case-insensitive), exclude self
  socket.on("search_user", async ({ email, userId }) => {
    try {
      if (!email) {
        return socket.emit("search_user_response", { success: false, users: [] });
      }

      const users = await User.find({
        email: { $regex: email, $options: "i" },
        _id: { $ne: userId },
      })
        .select("_id firstName lastName email")
        .limit(10);

      socket.emit("search_user_response", {
        success: true,
        users: users.map((u) => ({
          _id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        })),
      });
    } catch (err) {
      socket.emit("search_user_response", {
        success: false,
        users: [],
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // add_friend: create Friendship, notify target if online
  socket.on("add_friend", async ({ targetUserId, userId }) => {
    try {
      if (!targetUserId || !userId) {
        return socket.emit("add_friend_response", {
          success: false,
          message: "userId va targetUserId talab qilinadi.",
        });
      }

      // Check if friendship already exists in either direction
      const existing = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: targetUserId },
          { requester: targetUserId, recipient: userId },
        ],
      });

      if (existing) {
        return socket.emit("add_friend_response", {
          success: false,
          message:
            existing.status === "accepted"
              ? "Siz allaqachon do'stsiz."
              : "So'rov allaqachon yuborilgan.",
        });
      }

      const targetUser = await User.findById(targetUserId).select(
        "_id firstName lastName email"
      );

      if (!targetUser) {
        return socket.emit("add_friend_response", {
          success: false,
          message: "Foydalanuvchi topilmadi.",
        });
      }

      const request = await Friendship.create({
        requester: userId,
        recipient: targetUserId,
        status: "pending",
      });

      socket.emit("add_friend_response", {
        success: true,
        message: `${targetUser.firstName} ${targetUser.lastName}ga do'stlik so'rovi yuborildi.`,
        targetUserId: String(targetUser._id),
      });

      // Notify target user if they are online
      const targetSocketId = onlineUsers.get(String(targetUserId));
      if (targetSocketId) {
        const requester = await User.findById(userId).select(
          "_id firstName lastName email"
        );
        if (requester) {
          io.to(targetSocketId).emit("friend_request", {
            requestId: String(request._id),
            from: {
              _id: requester._id,
              firstName: requester.firstName,
              lastName: requester.lastName,
              email: requester.email,
            },
            createdAt: request.createdAt,
          });
        }
      }
    } catch (err) {
      socket.emit("add_friend_response", {
        success: false,
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // get_friend_requests: pending requests sent TO this user
  socket.on("get_friend_requests", async ({ userId }) => {
    try {
      if (!userId) {
        return socket.emit("friend_requests_list", { requests: [] });
      }

      const requests = await Friendship.find({
        recipient: userId,
        status: "pending",
      }).populate("requester", "_id firstName lastName email");

      socket.emit("friend_requests_list", {
        requests: requests.filter((r) => r.requester).map((r) => ({
          requestId: String(r._id),
          from: {
            _id: r.requester._id,
            firstName: r.requester.firstName,
            lastName: r.requester.lastName,
            email: r.requester.email,
          },
          createdAt: r.createdAt,
        })),
      });
    } catch (err) {
      socket.emit("friend_requests_list", {
        requests: [],
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // accept_friend_request: recipient qabul qiladi -> ikkala tomon do'st bo'ladi
  socket.on("accept_friend_request", async ({ requestId, userId }) => {
    try {
      const request = await Friendship.findOne({
        _id: requestId,
        recipient: userId,
        status: "pending",
      })
        .populate("requester", "_id firstName lastName email")
        .populate("recipient", "_id firstName lastName email");

      if (!request) {
        return socket.emit("accept_friend_response", {
          success: false,
          requestId,
          message: "So'rov topilmadi.",
        });
      }

      request.status = "accepted";
      await request.save();

      // Qabul qilgan foydalanuvchiga: yangi kontakt = so'rov yuborgan odam
      socket.emit("accept_friend_response", {
        success: true,
        requestId,
        contact: {
          _id: request.requester._id,
          firstName: request.requester.firstName,
          lastName: request.requester.lastName,
          email: request.requester.email,
        },
      });

      // So'rov yuborganga: qabul qilindi xabari + yangi kontakt
      const requesterSocketId = onlineUsers.get(String(request.requester._id));
      if (requesterSocketId) {
        io.to(requesterSocketId).emit("friend_request_accepted", {
          contact: {
            _id: request.recipient._id,
            firstName: request.recipient.firstName,
            lastName: request.recipient.lastName,
            email: request.recipient.email,
          },
        });
      }
    } catch (err) {
      socket.emit("accept_friend_response", {
        success: false,
        requestId,
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // reject_friend_request: so'rovni rad etish (o'chiriladi)
  socket.on("reject_friend_request", async ({ requestId, userId }) => {
    try {
      await Friendship.deleteOne({
        _id: requestId,
        recipient: userId,
        status: "pending",
      });
      socket.emit("reject_friend_response", { success: true, requestId });
    } catch (err) {
      socket.emit("reject_friend_response", {
        success: false,
        requestId,
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // get_contacts: all accepted friendships for this user
  socket.on("get_contacts", async ({ userId }) => {
    try {
      if (!userId) {
        return socket.emit("contacts_list", { contacts: [] });
      }

      const friendships = await Friendship.find({
        status: "accepted",
        $or: [{ requester: userId }, { recipient: userId }],
      })
        .populate("requester", "_id firstName lastName email")
        .populate("recipient", "_id firstName lastName email");

      const contacts = friendships
        // O'chirilgan foydalanuvchiga tegishli yozuvlarni tashlab yuborish
        .filter((f) => f.requester && f.recipient)
        .map((f) => {
          const contact =
            String(f.requester._id) === String(userId) ? f.recipient : f.requester;
          return {
            _id: contact._id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
          };
        });

      socket.emit("contacts_list", { contacts });
    } catch (err) {
      socket.emit("contacts_list", {
        contacts: [],
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // get_chats: same as contacts (chats = contacts in this simple version)
  socket.on("get_chats", async ({ userId }) => {
    try {
      if (!userId) {
        return socket.emit("chats_list", { chats: [] });
      }

      const friendships = await Friendship.find({
        status: "accepted",
        $or: [{ requester: userId }, { recipient: userId }],
      })
        .populate("requester", "_id firstName lastName email")
        .populate("recipient", "_id firstName lastName email");

      const chats = friendships
        .filter((f) => f.requester && f.recipient)
        .map((f) => {
          const contact =
            String(f.requester._id) === String(userId) ? f.recipient : f.requester;
          return {
            _id: contact._id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            lastMessage: "",
          };
        });

      socket.emit("chats_list", { chats });
    } catch (err) {
      socket.emit("chats_list", {
        chats: [],
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // send_message: save to DB, deliver to recipient if online, echo back to sender
  socket.on("send_message", async ({ senderId, recipientId, text }) => {
    try {
      if (!senderId || !recipientId || !text || !text.trim()) {
        return socket.emit("send_message_response", {
          success: false,
          message: "senderId, recipientId va text talab qilinadi.",
        });
      }

      const msg = await Message.create({
        sender: senderId,
        recipient: recipientId,
        text: text.trim(),
      });

      const payload = {
        _id: msg._id,
        sender: String(msg.sender),
        recipient: String(msg.recipient),
        text: msg.text,
        createdAt: msg.createdAt,
      };

      socket.emit("send_message_response", { success: true, message: payload });

      const recipientSocketId = onlineUsers.get(String(recipientId));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("new_message", { message: payload });
      }
    } catch (err) {
      socket.emit("send_message_response", {
        success: false,
        message: "Server xatosi: " + err.message,
      });
    }
  });

  // get_messages: conversation history between two users
  socket.on("get_messages", async ({ userId, contactId }) => {
    try {
      if (!userId || !contactId) {
        return socket.emit("messages_list", { contactId, messages: [] });
      }

      const messages = await Message.find({
        $or: [
          { sender: userId, recipient: contactId },
          { sender: contactId, recipient: userId },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(200);

      socket.emit("messages_list", {
        contactId,
        messages: messages.map((m) => ({
          _id: m._id,
          sender: String(m.sender),
          recipient: String(m.recipient),
          text: m.text,
          createdAt: m.createdAt,
        })),
      });
    } catch (err) {
      socket.emit("messages_list", {
        contactId,
        messages: [],
        message: "Server xatosi: " + err.message,
      });
    }
  });
};
