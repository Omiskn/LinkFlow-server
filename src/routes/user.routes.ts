import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { asyncHandler } from "../errors/asyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middlerware";

const router = Router();

router.post("/register", asyncHandler(userController.register));

router.post("/login", asyncHandler(userController.login));

router.get("/verify-email", asyncHandler(userController.verifyEmail));

router.get("/me", authMiddleware, asyncHandler(userController.getMe));

router.patch(
  "/me",
  authMiddleware,
  upload.single("profileImage"),
  asyncHandler(userController.updateMe),
);

export default router;
