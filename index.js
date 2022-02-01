const { instrument } = require("@socket.io/admin-ui");
const app = require("express")();
var http = require("http").createServer(app);

const io = require("socket.io")(process.env.PORT || 8900, {
  cors: {
    orgin: ["http://localhost:3000", "https://admin.socket.io/#/"],
  },
});

let allConnectedChatRooms = [];

app.get("/", (req, res) => {
  res.send("Socket connected");
});

const addUserChatRooms = (userId, socketId, chatRooms) => {
  !allConnectedChatRooms.some(
    (userChatRoom) => userChatRoom.userId === userId
  ) &&
    allConnectedChatRooms.push({
      userId: userId,
      socketId: socketId,
      chatRooms: chatRooms,
    });
};

const removeUser = (socketID) => {
  allConnectedChatRooms = allConnectedChatRooms.filter(
    (userChatRoom) => userChatRoom.socketId !== socketID
  );
};
io.on("connection", (socket) => {
  console.log("User connected:  " + socket.id);
  socket.on("addChatRooms", (userId, chatRooms) => {
    addUserChatRooms(userId, socket.id, chatRooms);
    io.emit("getUsersChatRooms", allConnectedChatRooms);
  });

  socket.on("join-room", (chatRooms) => {
    socket.join(chatRooms);
    console.log(socket.rooms);
  });

  socket.on("sendCurrentUser", (userId) => {
    //join user with current socketId to his or chatRooms
    let userConnectedChatRoom = allConnectedChatRooms.filter(
      (userChatRoom) => userChatRoom.userId === userId
    );
    // console.log(userConnectedChatRoom[0].chatRooms);
    userConnectedChatRoom[0].chatRooms.forEach((chatRoom) => {
      socket.join(chatRoom.chatRoomName);
    });
  });

  socket.on("leave-room", (chatRooms) => {
    socket.leave(chatRooms);
  });

  //send a message to other members in chat room
  socket.on(
    "sendMessage",
    ({ senderId, senderUsername, chatRoomId, chatRoomName, text }) => {
      socket.to(chatRoomName).emit("receiveMessage", {
        senderId,
        senderUsername,
        chatRoomId,
        chatRoomName,
        text,
      });
    }
  );

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

instrument(io, {
  auth: false,
});
