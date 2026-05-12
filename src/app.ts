import express from "express";
import userRoutes from "./routes/user.routes";
import linkRoutes from "./routes/link.routes";
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

app.use(authRouteLimiter);

app.use("/api/users", userRoutes);
app.use("/api/links", linkRoutes);

app.use(errorMiddleware);

export default app;
