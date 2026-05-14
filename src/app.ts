import express from "express";
import userRoutes from "./routes/user.routes";
import linkRoutes from "./routes/link.routes";
import clickRoutes from "./routes/click.routes";
import settingsRoutes from "./routes/settings.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { env } from "./config/env";
import {
  authRouteLimiter,
  setupSecurityMiddleware,
} from "./middlewares/security.middleware";
import { logger } from "./middlewares/logger";

const app = express();

if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

setupSecurityMiddleware(app);

app.use(express.json({ limit: "100kb" }));
app.use(logger);

app.get("/api", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "LinkFlow API index",
    data: {
      routes: {
        users: [
          "POST /api/users/register",
          "POST /api/users/login",
        ],
        links: [
          "POST /api/links/public/:linkId/click (no auth)",
          "GET /api/links",
          "GET /api/links/:linkId",
          "POST /api/links",
          "PATCH /api/links/:linkId",
          "DELETE /api/links/:linkId",
        ],
        clicks: [
          "GET /api/clicks/stats (counts: today, lastWeek, lastMonth, allTime)",
          "GET /api/clicks?period=today|week|month|all&limit=&offset=",
        ],
        settings: ["GET /api/settings", "PATCH /api/settings"],
      },
    },
  });
});

app.use(authRouteLimiter);

app.use("/api/users", userRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/clicks", clickRoutes);
app.use("/api/settings", settingsRoutes);

app.use(errorMiddleware);

export default app;
