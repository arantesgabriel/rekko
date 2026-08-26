import pino from "pino";

export const logger = pino({
  base: {
    service: "rekko-web",
  },
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "authorization",
      "cookie",
      "password",
      "token",
      "access_token",
      "refresh_token",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});
