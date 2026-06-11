import { Router } from "express";
import { asyncHandler } from "../errors/asyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { clickController } from "../controllers/click.controller";

const router = Router();

router.use(authMiddleware);

router.get("/stats", asyncHandler(clickController.stats));

router.get("/grouped", asyncHandler(clickController.grouped));

router.get("/links", asyncHandler(clickController.links));

export default router;
