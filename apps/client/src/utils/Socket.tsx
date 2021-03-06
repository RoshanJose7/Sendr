import React from "react";
import { io, Socket } from "socket.io-client";

const socketUrl =
  process.env.NODE_ENV !== "development"
    ? "https://sendr-api.herokuapp.com"
    : "http://localhost:8000";

export const socket = io(socketUrl, {
  path: "/socket.io",
  transports: ["websocket"],
});

export const SocketContext = React.createContext<Socket | null>(socket);
