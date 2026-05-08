const isDev = process.env.NODE_ENV === "development";

export const API_BASE = (() => {
  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/$/, "");
  }
  return isDev ? "" : "";
})();

export const SOCKET_HINT = isDev
  ? "in dev, leave REACT_APP_SOCKET_URL unset to use the proxy"
  : "set REACT_APP_SOCKET_URL to your backend origin (https://api.yoursite.com)";
