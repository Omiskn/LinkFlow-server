import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";

export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.users.findUnique({
      where: { email },
    });
  },

  findById: async (userId: number) => {
    return prisma.users.findUnique({
      where: { user_id: userId },
    });
  },

  create: async (data: Prisma.usersCreateInput) => {
    return prisma.users.create({
      data,
    });
  },
};
