const rawServerBaseUrl =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3001";

// Normalize once so callers can safely append paths.
export const SERVER_BASE_URL = rawServerBaseUrl.replace(/\/+$/, "");
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;
