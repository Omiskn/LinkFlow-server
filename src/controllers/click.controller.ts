import { Request, Response } from "express";
import { clickService, parseClickPeriod } from "../services/click.service";
import { sendSuccess } from "../utils/apiResponse";

function parseLimitOffset(req: Request) {
  const limitRaw = Number(req.query.limit);
  const offsetRaw = Number(req.query.offset);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 50;
  const offset = Number.isFinite(offsetRaw)
    ? Math.max(0, Math.floor(offsetRaw))
    : 0;
  return { limit, offset };
}

export const clickController = {
  stats: async (req: Request, res: Response) => {
    const result = await clickService.getStats(req.user!.userId);
    sendSuccess(res, "Click statistics.", result, 200);
  },

  list: async (req: Request, res: Response) => {
    const period = parseClickPeriod(req.query.period ?? "all");
    const { limit, offset } = parseLimitOffset(req);
    const result = await clickService.listClicks(
      req.user!.userId,
      period,
      limit,
      offset,
    );
    sendSuccess(res, "Clicks fetched.", result, 200);
  },
};
