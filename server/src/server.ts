import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:3000/",
  },
  transports: ["websocket"],
  allowUpgrades: false,
  serveClient: false,
});

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("joinRoom", (roomName) => {
    socket.join([roomName]);
  });

  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
  });

  socket.on("fileTransfer", (data) => {
    io.in("ggxd").emit("fileTransfer", data);
  });

  socket.on("filePart", (data) => {
    io.in("ggxd").emit("filePart", data);
    console.log(data.progressPercentage + "recieved");
  });

  socket.on("fileSent", (data) => {
    io.in("ggxd").emit("fileRecieved", data);
    console.log("File Recieved successfully");
  });
});

io.listen(8000);
console.log("Websockets server started at port 8000");
