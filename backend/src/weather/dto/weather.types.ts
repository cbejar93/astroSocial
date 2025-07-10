export type TimeBlock = "0" | "6" | "12" | "18" | "21";

export type WeatherDay = {
  date: string; // "2025-07-12"
  conditions: Record<
    keyof typeof timeBlockDataKeys,
    Partial<Record<TimeBlock, number>>
  >;
};

export const timeBlockDataKeys = {
  temperature: "temperature_2m",
  visibility: "visibility",
  cloudcover: "cloudcover",
  humidity: "relative_humidity_2m",
  precipitation: "precipitation_probability",
  windspeed: "windspeed_10m",
} as const;