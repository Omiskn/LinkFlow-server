import express from "express";
import userRoutes from "./routes/user.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { env } from "./config/env";
import { setupSecurityMiddleware } from "./middlewares/security.middleware";

const app = express();

if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

setupSecurityMiddleware(app);

app.use(express.json({ limit: "100kb" }));

app.use("/api/users", userRoutes);

app.use(errorMiddleware);

export default app;
