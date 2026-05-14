/** Optional metadata when recording a public link click (client hints / geo). */
export type RecordClickMetaDTO = {
  country?: string;
  device_type?: string;
  browser?: string;
};

export type ClickPeriodQuery = "today" | "week" | "month" | "all";
