import { prisma } from "../database/prisma";

export const passwordResetRepository = {
  create: async (data: { token: string; user_id: number; expire_at: Date }) => {
    return prisma.password_reset_token.create({
      data,
    });
  },

  findByToken: async (token: string) => {
    return prisma.password_reset_token.findUnique({
      where: { token },
      include: { users: true },
    });
  },

  deleteByToken: async (token: string) => {
    return prisma.password_reset_token.deleteMany({
      where: { token },
    });
  },

  deleteByUserId: async (userId: number) => {
    return prisma.password_reset_token.deleteMany({
      where: { user_id: userId },
    });
  },
};
