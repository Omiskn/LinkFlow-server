import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { linkService } from "../services/link.service";
import { sendSuccess } from "../utils/apiResponse";
import { UpdateLinkDTO } from "../types/link";

function requireLinkIdParam(req: Request): number {
  const id = Number(req.params.linkId);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("Invalid link id", 400);
  }
  return id;
}

export const linkController = {
  listLinks: async (req: Request, res: Response) => {
    const result = await linkService.listLinks(req.user!.userId);
    sendSuccess(res, "Links fetched successfully.", result, 200);
  },

  getLink: async (req: Request, res: Response) => {
    const linkId = requireLinkIdParam(req);
    const result = await linkService.getLink(linkId, req.user!.userId);
    sendSuccess(res, "Link fetched successfully.", result, 200);
  },

  addLink: async (req: Request, res: Response) => {
    const result = await linkService.addLink(req.body, req.user!.userId);
    sendSuccess(res, "Link created successfully.", result, 201);
  },

  updateLink: async (req: Request, res: Response) => {
    const linkId = requireLinkIdParam(req);
    const patch = req.body as UpdateLinkDTO;
    const result = await linkService.updateLink(
      linkId,
      req.user!.userId,
      patch,
    );
    sendSuccess(res, "Link updated successfully.", result, 200);
  },

  deleteLink: async (req: Request, res: Response) => {
    const linkId = requireLinkIdParam(req);
    await linkService.deleteLink(linkId, req.user!.userId);
    sendSuccess(res, "Link deleted successfully.", undefined, 200);
  },

  recordClick: async (req: Request, res: Response) => {
    const linkId = requireLinkIdParam(req);
    const result = await linkService.recordClick(linkId, req.body);
    sendSuccess(res, "Click recorded.", result, 200);
  },
};
