import log from "loglevel";

// In Node.js environment (SSR, API routes), import.meta.env might not be fully available
// We use a robust check that works in both browser and Node.js contexts
const isDev =
  (typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined" && import.meta.env.DEV === true) ||
  process.env.NODE_ENV === "development" ||
  process.env.DEV === "true";

log.setLevel(isDev ? "debug" : "warn");

export default log;
