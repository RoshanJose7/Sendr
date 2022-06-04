import { Server } from "socket.io";

const port: number = Number.parseInt(process.env.PORT!) || 8000;

const io = new Server({
  path: "/socket.io",
  transports: ["websocket"],
});

const usersInRoom = new Map<string, string[]>();

io.on("connection", (socket) => {
  socket.on("joinRoom", (data) => {
    if (usersInRoom.has(data.room)) {
      const users: string[] = usersInRoom.get(data.room)!;
      usersInRoom.set(data.room, [...users, socket.id]);
    } else usersInRoom.set(data.room, [socket.id]);

    socket.join([data.room]);
    io.in(data.room).emit("user_joined", data.name);
  });

  socket.on("leaveRoom", (data) => {
    if (!usersInRoom.has(data.room)) usersInRoom.delete(data.room);

    socket.leave(data.room);
    io.in(data.room).emit("user_left", data.name);
  });

  socket.on("senderFileTransfer", (data) => {
    socket.broadcast.in(data.room).emit("recieverFileTransfer", data);
  });

  socket.on("senderFilePart", (data) => {
    socket.broadcast.in(data.room).emit("recieverFilePart", data);
  });

  socket.on("senderFileSent", (data) => {
    socket.broadcast
      .in(data.room)
      .emit("recieverFileSent", { ...data, sender: data.sender });
  });

  socket.on("recievedPercentage", (data) => {
    socket.to(data.senderid).emit("sentPercentage", data);
  });

  socket.on("disconnect", () => {
    socket.removeAllListeners();
    socket.disconnect();
  });
});

io.listen(port);
console.log("Websockets server started at port " + port);
