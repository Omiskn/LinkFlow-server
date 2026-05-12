import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { asyncHandler } from "../errors/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(userController.register));

router.post("/login", asyncHandler(userController.login));

export default router;
