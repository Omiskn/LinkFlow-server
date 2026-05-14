import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";

export const settingsRepository = {
  findByUserId: async (userId: number) => {
    return prisma.user_settings.findUnique({
      where: { user_id: userId },
    });
  },

  upsertDefaults: async (userId: number) => {
    return prisma.user_settings.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
    });
  },

  update: async (userId: number, data: Prisma.user_settingsUpdateInput) => {
    return prisma.user_settings.update({
      where: { user_id: userId },
      data,
    });
  },
};
