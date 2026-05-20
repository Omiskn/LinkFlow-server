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

  findByVerificationToken: async (token: string) => {
    return prisma.users.findFirst({
      where: { verification_token: token },
    });
  },

  updateById: async (userId: number, data: Prisma.usersUpdateInput) => {
    return prisma.users.update({
      where: { user_id: userId },
      data,
    });
  },
};
