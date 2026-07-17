const { io } = require("socket.io-client");

const URL = "http://localhost:5000";
const ts = Date.now();
const emailA = `testa${ts}@test.uz`;
const emailB = `testb${ts}@test.uz`;

function waitFor(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

async function main() {
  const a = io(URL);
  const b = io(URL);

  // 1. Register both users
  a.emit("register", { firstName: "TestA", lastName: "Userov", age: 25, email: emailA, password: "123456" });
  const regA = await waitFor(a, "register_response");
  console.log("A register:", regA.success);

  b.emit("register", { firstName: "TestB", lastName: "Userova", age: 25, email: emailB, password: "123456" });
  const regB = await waitFor(b, "register_response");
  console.log("B register:", regB.success);

  const idA = regA.user.id;
  const idB = regB.user.id;

  // 2. Register socket mapping
  a.emit("register_user", { userId: idA });
  b.emit("register_user", { userId: idB });

  // 3. A adds B as friend
  a.emit("add_friend", { targetUserId: idB, userId: idA });
  const af = await waitFor(a, "add_friend_response");
  console.log("A add_friend:", af.success);

  // 4. A sends message to B — B must receive new_message
  const bReceives = waitFor(b, "new_message");
  a.emit("send_message", { senderId: idA, recipientId: idB, text: "Salom B!" });
  const sendResp = await waitFor(a, "send_message_response");
  console.log("A send_message:", sendResp.success);
  const received = await bReceives;
  console.log("B received new_message:", received.message.text === "Salom B!" ? "OK" : "FAIL", "-", received.message.text);

  // 5. B replies — A must receive
  const aReceives = waitFor(a, "new_message");
  b.emit("send_message", { senderId: idB, recipientId: idA, text: "Salom A, xabar keldi!" });
  const reply = await aReceives;
  console.log("A received reply:", reply.message.text === "Salom A, xabar keldi!" ? "OK" : "FAIL", "-", reply.message.text);

  // 6. Message history
  a.emit("get_messages", { userId: idA, contactId: idB });
  const hist = await waitFor(a, "messages_list");
  console.log("History count:", hist.messages.length, "(expected 2)");

  a.disconnect();
  b.disconnect();
  console.log("\nTEST TUGADI");
  process.exit(hist.messages.length === 2 ? 0 : 1);
}

main().catch((e) => {
  console.error("TEST XATO:", e.message);
  process.exit(1);
});
