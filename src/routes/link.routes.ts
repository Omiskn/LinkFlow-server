import { Router } from "express";
import { asyncHandler } from "../errors/asyncHandler";
import { linkController } from "../controllers/link.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/** No auth — for public profile pages to register a tap before redirect. */
router.post(
  "/public/:linkId/click",
  asyncHandler(linkController.recordClick),
);

router.use(authMiddleware);

router.get("/", asyncHandler(linkController.listLinks));
router.get("/:linkId", asyncHandler(linkController.getLink));
router.post("/", asyncHandler(linkController.addLink));
router.patch("/:linkId", asyncHandler(linkController.updateLink));
router.delete("/:linkId", asyncHandler(linkController.deleteLink));

export default router;
