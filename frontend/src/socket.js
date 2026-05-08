import { io } from "socket.io-client";

const SOCKET_OPTIONS = { transports: ["websocket", "polling"] };
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.NODE_ENV === "development" ? null : "http://127.0.0.1:5000");

export const socket = SOCKET_URL
  ? io(SOCKET_URL, SOCKET_OPTIONS)
  : io(SOCKET_OPTIONS);

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("disconnect", () => {
  console.log("SOCKET DISCONNECTED");
});