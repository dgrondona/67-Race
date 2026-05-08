export const API_BASE =
  process.env.NODE_ENV === "development"
    ? ""
    : (process.env.REACT_APP_API_URL || "http://127.0.0.1:5000");
