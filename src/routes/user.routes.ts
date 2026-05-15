import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { asyncHandler } from "../errors/asyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", asyncHandler(userController.register));

router.post("/login", asyncHandler(userController.login));

router.get("/verify-email", asyncHandler(userController.verifyEmail));

router.get("/me", authMiddleware, asyncHandler(userController.getMe));

export default router;
