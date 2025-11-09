import log from "loglevel";

const isDev = import.meta.env.DEV;

log.setLevel(isDev ? "debug" : "warn");

export default log;
