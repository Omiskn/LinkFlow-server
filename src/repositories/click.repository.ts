// import { prisma } from "../database/prisma";
// import { Prisma } from "../generated/prisma/client";

// export type ClickListParams = {
//   userId: number;
//   from?: Date;
//   to?: Date;
//   skip: number;
//   take: number | undefined;
// };

// export const clickRepository = {
//   create: async (data: Prisma.clicksCreateInput) => {
//     return prisma.clicks.create({ data });
//   },

//   countForUser: async (
//     userId: number,
//     range?: { from?: Date; to?: Date },
//   ): Promise<number> => {
//     return prisma.clicks.count({
//       where: {
//         links: { user_id: userId },
//         ...(range?.from || range?.to
//           ? {
//               clicked_at: {
//                 ...(range.from ? { gte: range.from } : {}),
//                 ...(range.to ? { lte: range.to } : {}),
//               },
//             }
//           : {}),
//       },
//     });
//   },

//   findManyForUser: async (params: ClickListParams) => {
//     const { userId, from, to, skip, take } = params;
//     return prisma.clicks.findMany({
//       where: {
//         links: { user_id: userId },
//         ...(from || to
//           ? {
//               clicked_at: {
//                 ...(from ? { gte: from } : {}),
//                 ...(to ? { lte: to } : {}),
//               },
//             }
//           : {}),
//       },
//       include: {
//         links: {
//           select: {
//             link_id: true,
//             title: true,
//             url: true,
//             click_count: true,
//           },
//         },
//       },
//     });
//   },
// };

import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";
import { DateRange, GroupBy } from "../types/click";

const buildDateFilter = (range?: DateRange) => {
  if (!range?.from && !range?.to) return {};

  return {
    clicked_at: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
};

export const clickRepository = {
  create: async (data: Prisma.clicksCreateInput) => {
    return prisma.clicks.create({ data });
  },

  countForUser: async (userId: number, range?: DateRange): Promise<number> => {
    return prisma.clicks.count({
      where: {
        links: {
          user_id: userId,
        },
        ...buildDateFilter(range),
      },
    });
  },

  groupBy: async (userId: number, groupBy: GroupBy, range?: DateRange) => {
    return prisma.clicks.groupBy({
      by: [groupBy],
      where: {
        links: {
          user_id: userId,
        },
        ...buildDateFilter(range),
      },
      _count: {
        click_id: true,
      },
      orderBy: {
        _count: {
          click_id: "desc",
        },
      },
    });
  },

  groupByLink: async (userId: number, range?: DateRange) => {
    return prisma.links.findMany({
      where: {
        user_id: userId,
      },
      select: {
        // link_id: true,
        title: true,
        _count: {
          select: {
            clicks: {
              where: buildDateFilter(range),
            },
          },
        },
      },
    });
  },
};
