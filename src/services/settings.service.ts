import { AppError } from "../errors/AppError";
import { Prisma } from "../generated/prisma/client";
import { settingsRepository } from "../repositories/settings.repository";
import { UpdateSettingsDTO } from "../types/settings";

const FIELD_MAX: Record<keyof UpdateSettingsDTO, number> = {
  theme: 20,
  primary_color: 20,
  font_style: 50,
  button_style: 50,
  background: 50,
  language: 10,
};

function assertSettingsPatch(patch: UpdateSettingsDTO) {
  (Object.keys(FIELD_MAX) as (keyof UpdateSettingsDTO)[]).forEach((key) => {
    const v = patch[key];
    if (v === undefined) return;
    if (typeof v !== "string") {
      throw new AppError(`Invalid ${key}`, 400);
    }
    const t = v.trim();
    if (t.length > FIELD_MAX[key]) {
      throw new AppError(`${key} is too long`, 400);
    }
  });
}

function buildUpdateInput(
  patch: UpdateSettingsDTO,
): Prisma.user_settingsUpdateInput {
  const out: Prisma.user_settingsUpdateInput = {};
  if (patch.theme_mode !== undefined) out.theme_mode = patch.theme_mode.trim();
  if (patch.primary_color !== undefined)
    out.primary_color = patch.primary_color.trim();
  if (patch.font_style !== undefined) out.font_style = patch.font_style.trim();
  if (patch.button_style !== undefined)
    out.button_style = patch.button_style.trim();
  if (patch.language !== undefined) out.language = patch.language.trim();
  return out;
}

export const settingsService = {
  /** Ensures a settings row exists (e.g. after registration). */
  ensureRow: async (userId: number) => {
    await settingsRepository.upsertDefaults(userId);
  },

  getSettings: async (userId: number) => {
    return settingsRepository.upsertDefaults(userId);
  },

  updateSettings: async (userId: number, patch: UpdateSettingsDTO) => {
    console.log("hello");
    assertSettingsPatch(patch);
    const data = buildUpdateInput(patch);
    console.log(data);
    if (Object.keys(data).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }
    await settingsRepository.upsertDefaults(userId);
    return settingsRepository.update(userId, {
      ...data,
      updated_at: new Date(),
    });
  },
};
