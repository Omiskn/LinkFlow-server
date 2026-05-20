export interface LinkDTO {
  title: string;
  url: string;
  icon?: string;
  link_type?: string;
  is_active?: boolean;
  position?: number;
}

/** Partial update; omit fields you do not want to change. */
export type UpdateLinkDTO = Partial<
  Pick<
    LinkDTO,
    "title" | "url" | "icon" | "link_type" | "is_active" | "position"
  >
>;
