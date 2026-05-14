import { Request, Response } from "express";
import { settingsService } from "../services/settings.service";
import { sendSuccess } from "../utils/apiResponse";
import { UpdateSettingsDTO } from "../types/settings";

export const settingsController = {
  get: async (req: Request, res: Response) => {
    const result = await settingsService.getSettings(req.user!.userId);
    sendSuccess(res, "Settings fetched.", result, 200);
  },

  patch: async (req: Request, res: Response) => {
    const patch = req.body as UpdateSettingsDTO;
    const result = await settingsService.updateSettings(
      req.user!.userId,
      patch,
    );
    sendSuccess(res, "Settings updated.", result, 200);
  },
};
