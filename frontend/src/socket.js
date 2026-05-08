import { io } from "socket.io-client";

const SOCKET_OPTIONS = { transports: ["websocket", "polling"] };

function socketUrl() {
  const fromEnv = process.env.REACT_APP_SOCKET_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return String(fromEnv).trim().replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return null;
  }
  return typeof window !== "undefined" ? window.location.origin : "";
}

const url = socketUrl();

export const socket = url
  ? io(url, SOCKET_OPTIONS)
  : io(SOCKET_OPTIONS);

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("disconnect", () => {
  console.log("SOCKET DISCONNECTED");
});
