import { Router } from "express";
import { asyncHandler } from "../errors/asyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { clickController } from "../controllers/click.controller";

const router = Router();

router.use(authMiddleware);

router.get("/stats", asyncHandler(clickController.stats));
router.get("/", asyncHandler(clickController.list));

export default router;
