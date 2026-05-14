import { AppError } from "../errors/AppError";
import type { ClickPeriodQuery } from "../types/click";
import { clickRepository } from "../repositories/click.repository";

const MS_DAY = 86_400_000;

export function startOfUtcToday(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function rollingSinceMs(ms: number): Date {
  return new Date(Date.now() - ms);
}

export function periodToRange(period: ClickPeriodQuery): {
  from?: Date;
  to?: Date;
} {
  const now = new Date();
  switch (period) {
    case "today":
      return { from: startOfUtcToday(now), to: now };
    case "week":
      return { from: rollingSinceMs(7 * MS_DAY), to: now };
    case "month":
      return { from: rollingSinceMs(30 * MS_DAY), to: now };
    case "all":
    default:
      return {};
  }
}

export function parseClickPeriod(value: unknown): ClickPeriodQuery {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "today" ||
    raw === "week" ||
    raw === "month" ||
    raw === "all"
  ) {
    return raw;
  }
  throw new AppError(
    "Invalid period. Use today, week, month, or all.",
    400,
  );
}

export const clickService = {
  /** Counts: today (UTC day), rolling last 7 days, rolling last 30 days, all time. */
  getStats: async (userId: number) => {
    const todayStart = startOfUtcToday();
    const now = new Date();

    const [today, lastWeek, lastMonth, allTime] = await Promise.all([
      clickRepository.countForUser(userId, { from: todayStart, to: now }),
      clickRepository.countForUser(userId, {
        from: rollingSinceMs(7 * MS_DAY),
        to: now,
      }),
      clickRepository.countForUser(userId, {
        from: rollingSinceMs(30 * MS_DAY),
        to: now,
      }),
      clickRepository.countForUser(userId),
    ]);

    return {
      today,
      lastWeek,
      lastMonth,
      allTime,
      definitions: {
        today: "Clicks with clicked_at on or after 00:00:00 UTC today.",
        lastWeek: "Rolling window: last 7×24 hours from now.",
        lastMonth: "Rolling window: last 30×24 hours from now.",
        allTime: "Every click for your links.",
      },
    };
  },

  listClicks: async (
    userId: number,
    period: ClickPeriodQuery,
    limit: number,
    offset: number,
  ) => {
    const { from, to } = periodToRange(period);
    const rows = await clickRepository.findManyForUser({
      userId,
      from,
      to,
      skip: offset,
      take: limit,
    });
    const total = await clickRepository.countForUser(userId, { from, to });
    return {
      period,
      total,
      limit,
      offset,
      items: rows.map((row) => ({
        click_id: row.click_id,
        link_id: row.link_id,
        clicked_at: row.clicked_at,
        country: row.country,
        device_type: row.device_type,
        browser: row.browser,
        link: row.links,
      })),
    };
  },
};
