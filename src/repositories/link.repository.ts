import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";

export const linkRepositories = {
  findByIdAndUserId: async (linkId: number, userId: number) => {
    return prisma.links.findFirst({
      where: {
        link_id: linkId,
        user_id: userId,
      },
    });
  },

  findActiveById: async (linkId: number) => {
    return prisma.links.findFirst({
      where: { link_id: linkId, is_active: true },
    });
  },

  findLinksForSpecificUser: async (userId: number) => {
    return prisma.links.findMany({
      where: { user_id: userId },
      orderBy: [{ position: "asc" }, { link_id: "asc" }],
    });
  },

  maxPositionForUser: async (userId: number) => {
    const agg = await prisma.links.aggregate({
      where: { user_id: userId },
      _max: { position: true },
    });
    return agg._max.position ?? -1;
  },

  deleteLink: async (linkId: number) => {
    return prisma.links.delete({ where: { link_id: linkId } });
  },

  addLink: async (data: Prisma.linksCreateInput) => {
    return prisma.links.create({ data });
  },

  updateLink: async (linkId: number, data: Prisma.linksUpdateInput) => {
    return prisma.links.update({ where: { link_id: linkId }, data });
  },

  incrementClickCount: async (linkId: number) => {
    return prisma.links.update({
      where: { link_id: linkId },
      data: {
        click_count: { increment: 1 },
        updated_at: new Date(),
      },
    });
  },

  /**
   * Creates a clicks row and increments link.click_count atomically.
   * Returns the link (with url) if active; otherwise null.
   */
  recordClickWithRow: async (
    linkId: number,
    meta: { country?: string; device_type?: string; browser?: string },
  ) => {
    return prisma.$transaction(async (tx) => {
      const link = await tx.links.findFirst({
        where: { link_id: linkId, is_active: true },
      });
      if (!link) {
        return null;
      }
      await tx.clicks.create({
        data: {
          link_id: linkId,
          country: meta.country,
          device_type: meta.device_type,
          browser: meta.browser,
        },
      });
      await tx.links.update({
        where: { link_id: linkId },
        data: {
          click_count: { increment: 1 },
          updated_at: new Date(),
        },
      });
      return link;
    });
  },
};
