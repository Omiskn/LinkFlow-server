import { AppError } from "../errors/AppError";
import type { links } from "../generated/prisma/client";
import { Prisma } from "../generated/prisma/client";
import { linkRepositories } from "../repositories/link.repository";
import { LinkDTO, UpdateLinkDTO } from "../types/link";

const TITLE_MIN = 2;
const TITLE_MAX = 100;
const ICON_MAX = 50;
const LINK_TYPE_MAX = 30;

function assertUrl(url: string) {
  try {
    const u = new URL(url);
    const allowed = ["http:", "https:", "mailto:", "tel:"];
    if (!allowed.includes(u.protocol)) {
      throw new AppError("URL must use http, https, mailto, or tel", 400);
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("Invalid url", 400);
  }
}

function assertTitle(title: string) {
  if (
    typeof title !== "string" ||
    title.trim().length < TITLE_MIN ||
    title.length > TITLE_MAX
  ) {
    throw new AppError(
      `title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`,
      400,
    );
  }
}

function assertOptionalString(
  value: string | undefined,
  field: string,
  maxLen: number,
) {
  if (value === undefined) return;
  if (typeof value !== "string" || value.length > maxLen) {
    throw new AppError(`Invalid ${field}`, 400);
  }
}

function assertLinkCreate(data: LinkDTO) {
  assertTitle(data.title);
  if (typeof data.url !== "string" || data.url.trim().length === 0) {
    throw new AppError("Invalid url", 400);
  }
  assertUrl(data.url.trim());
  assertOptionalString(data.icon, "icon", ICON_MAX);
  assertOptionalString(data.link_type, "link_type", LINK_TYPE_MAX);
  if (
    data.position !== undefined &&
    (!Number.isInteger(data.position) || data.position < 0)
  ) {
    throw new AppError("position must be a non-negative integer", 400);
  }
  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    throw new AppError("is_active must be a boolean", 400);
  }
}

function assertLinkUpdate(patch: UpdateLinkDTO) {
  if (patch.title !== undefined) assertTitle(patch.title);
  if (patch.url !== undefined) {
    if (typeof patch.url !== "string" || patch.url.trim().length === 0) {
      throw new AppError("Invalid url", 400);
    }
    assertUrl(patch.url.trim());
  }
  assertOptionalString(patch.icon, "icon", ICON_MAX);
  assertOptionalString(patch.link_type, "link_type", LINK_TYPE_MAX);
  if (
    patch.position !== undefined &&
    (!Number.isInteger(patch.position) || patch.position < 0)
  ) {
    throw new AppError("position must be a non-negative integer", 400);
  }
  if (patch.is_active !== undefined && typeof patch.is_active !== "boolean") {
    throw new AppError("is_active must be a boolean", 400);
  }
}

function toPublicLink(link: links) {
  const { user_id: _omit, ...rest } = link;
  return rest;
}

async function requireOwnedLink(linkId: number, userId: number) {
  if (!Number.isInteger(linkId) || linkId < 1) {
    throw new AppError("Invalid link id", 400);
  }
  const link = await linkRepositories.findByIdAndUserId(linkId, userId);
  if (!link) {
    throw new AppError("Link not found", 404);
  }
  return link;
}

export const linkService = {
  listLinks: async (userId: number) => {
    const rows = await linkRepositories.findLinksForSpecificUser(userId);
    return rows.map(toPublicLink);
  },

  getLink: async (linkId: number, userId: number) => {
    const link = await requireOwnedLink(linkId, userId);
    return toPublicLink(link);
  },

  addLink: async (input: LinkDTO, userId: number) => {
    assertLinkCreate(input);

    const maxPos = await linkRepositories.maxPositionForUser(userId);
    const position = input.position !== undefined ? input.position : maxPos + 1;

    const created = await linkRepositories.addLink({
      title: input.title.trim(),
      url: input.url.trim(),
      icon: input.icon?.trim() || undefined,
      link_type: input.link_type?.trim() || "custom",
      is_active: input.is_active ?? true,
      position,
      users: { connect: { user_id: userId } },
    });

    return toPublicLink(created);
  },

  updateLink: async (linkId: number, userId: number, patch: UpdateLinkDTO) => {
    await requireOwnedLink(linkId, userId);
    assertLinkUpdate(patch);

    const data: Prisma.linksUpdateInput = { updated_at: new Date() };
    if (patch.title !== undefined) data.title = patch.title.trim();
    if (patch.url !== undefined) data.url = patch.url.trim();
    if (patch.icon !== undefined) data.icon = patch.icon.trim() || null;
    if (patch.link_type !== undefined)
      data.link_type = patch.link_type.trim() || "custom";
    if (patch.is_active !== undefined) data.is_active = patch.is_active;
    if (patch.position !== undefined) data.position = patch.position;

    const updated = await linkRepositories.updateLink(linkId, data);
    return toPublicLink(updated);
  },

  deleteLink: async (linkId: number, userId: number) => {
    await requireOwnedLink(linkId, userId);
    await linkRepositories.deleteLink(linkId);
  },

  /** Public: increments click_count for an active link (e.g. profile page analytics). */
  recordClick: async (linkId: number) => {
    const link = await linkRepositories.findActiveById(linkId);
    if (!link) {
      throw new AppError("Link not found", 404);
    }
    await linkRepositories.incrementClickCount(linkId);
    return { url: link.url };
  },
};
