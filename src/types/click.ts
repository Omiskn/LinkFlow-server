/** Optional metadata when recording a public link click (client hints / geo). */
export type RecordClickMetaDTO = {
  country?: string;
  device_type?: string;
  browser?: string;
};

export type ClickPeriodQuery = "today" | "week" | "month" | "all";

export type GroupBy = "device_type" | "country" | "browser";

export type DateRange = {
  from?: Date;
  to?: Date;
};
