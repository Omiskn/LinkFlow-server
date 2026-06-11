import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { clickService, parseClickPeriod } from "../services/click.service";
import { sendSuccess } from "../utils/apiResponse";
import { GroupBy } from "../types/click";

function parseGroupBy(value: unknown): GroupBy {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "country" || raw === "device_type" || raw === "browser") {
    return raw;
  }

  throw new AppError(
    "Invalid groupBy. Use country, device_type or browser.",
    400,
  );
}

export const clickController = {
  stats: async (req: Request, res: Response) => {
    const result = await clickService.getStats(req.user!.userId);

    sendSuccess(res, "Click statistics.", result, 200);
  },

  grouped: async (req: Request, res: Response) => {
    const period = parseClickPeriod(req.query.period ?? "all");
    const groupBy = parseGroupBy(req.query.by);

    const result = await clickService.getGroupedAnalytics(
      req.user!.userId,
      period,
      groupBy,
    );

    sendSuccess(res, "Analytics fetched.", result, 200);
  },

  links: async (req: Request, res: Response) => {
    const period = parseClickPeriod(req.query.period ?? "all");

    const result = await clickService.getLinksAnalytics(
      req.user!.userId,
      period,
    );

    sendSuccess(res, "Links analytics fetched.", result, 200);
  },
};
