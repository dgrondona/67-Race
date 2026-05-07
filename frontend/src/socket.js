import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"],
  autoConnect: true
});

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("SOCKET ERROR:", err.message);
});

socket.on("disconnect", () => {
  console.log("SOCKET DISCONNECTED");
});