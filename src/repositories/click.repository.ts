import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";

export type ClickListParams = {
  userId: number;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};

export const clickRepository = {
  create: async (data: Prisma.clicksCreateInput) => {
    return prisma.clicks.create({ data });
  },

  countForUser: async (
    userId: number,
    range?: { from?: Date; to?: Date },
  ): Promise<number> => {
    return prisma.clicks.count({
      where: {
        links: { user_id: userId },
        ...(range?.from || range?.to
          ? {
              clicked_at: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lte: range.to } : {}),
              },
            }
          : {}),
      },
    });
  },

  findManyForUser: async (params: ClickListParams) => {
    const { userId, from, to, skip, take } = params;
    return prisma.clicks.findMany({
      where: {
        links: { user_id: userId },
        ...(from || to
          ? {
              clicked_at: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { clicked_at: "desc" },
      skip,
      take,
      include: {
        links: { select: { link_id: true, title: true, url: true } },
      },
    });
  },
};
