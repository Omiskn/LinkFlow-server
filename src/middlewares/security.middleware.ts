import { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export function setupSecurityMiddleware(app: Express) {
  app.disable("x-powered-by");
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (!env.isProd) {
          callback(null, true);
          return;
        }
        if (env.CORS_ORIGINS.length === 0) {
          callback(null, false);
          return;
        }
        callback(null, env.CORS_ORIGINS.includes(origin));
      },
      credentials: true,
      maxAge: 86_400,
    }),
  );
}

/** Limits brute-force attempts on login/register. */
export const authRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  // When behind a reverse proxy with `trust proxy` set, disable the check that flags that as unsafe.
  validate: env.TRUST_PROXY ? { trustProxy: false } : true,
});
