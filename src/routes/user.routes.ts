import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { asyncHandler } from "../errors/asyncHandler";
import { authRouteLimiter } from "../middlewares/security.middleware";

const router = Router();

router.post(
  "/register",
  authRouteLimiter,
  asyncHandler(userController.register),
);

router.post("/login", authRouteLimiter, asyncHandler(userController.login));

export default router;
