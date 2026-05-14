import { Router } from "express";
import { asyncHandler } from "../errors/asyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { settingsController } from "../controllers/settings.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(settingsController.get));
router.patch("/", asyncHandler(settingsController.patch));

export default router;
