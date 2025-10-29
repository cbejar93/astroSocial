import type {
  WeatherData as ApiWeatherData,
  WeatherDay as ApiWeatherDay,
} from "../types/weather";

/* ======= Simple UI helpers/mocks (unchanged) ======= */
export const mockCurrentWeather = {
  location: "La Palma, Canary Islands",
  date: "July 3, 2025",
  temperature: "14°C",
  condition: "Clear",
  icon: "☀️",
};

export const mockForecast = [
  { day: "Thu", temp: "13°C", icon: "☀️" },
  { day: "Fri", temp: "15°C", icon: "🌤️" },
  { day: "Sat", temp: "12°C", icon: "🌧️" },
  { day: "Sun", temp: "13°C", icon: "☁️" },
  { day: "Mon", temp: "14°C", icon: "☀️" },
];

export type WeatherConditionLevel = 1 | 2 | 3 | 4;

/** color classes for 1..4 */
export const conditionColors: Record<WeatherConditionLevel, string> = {
  1: "bg-gray-600",  // Worst
  2: "bg-yellow-500",
  3: "bg-blue-500",
  4: "bg-green-500", // Best
};

export type TimeBlock =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19"
  | "20" | "21" | "22" | "23";

/* ======= MOCK DATA shaped like ApiWeatherDay ======= */
/* NOTE:
   - Replaced `conditions.clouds` with `conditions.cloudcover`
   - Removed custom keys `seeing` and `transparency` (unless your types allow extras)
   - Added `astro` with sunrise/sunset/moonrise/moonset + moonPhase
*/
export const mockWeatherData: ApiWeatherDay[] = [
  {
    date: "2025-07-03",
    conditions: {
      cloudcover: { "0": 3, "6": 2, "12": 3, "18": 1, "21": 2 },
      // optional: temperature/wind/etc if you want
      // temperature: { "18": 14 },
      // windspeed:   { "18": 8 },
      // winddirection:{ "18": 120 },
      // precipitation:{ "18": 0 },
    },
    astro: {
      sunrise: "06:04:00",
      sunset: "20:53:00",
      moonrise: "11:58:00",
      moonset: "23:41:00",
      moonPhase: { phase: "Waxing Crescent", illumination: 0.42 },
    },
  },
  {
    date: "2025-07-04",
    conditions: {
      cloudcover: { "0": 2, "6": 1, "12": 4, "18": 3, "21": 2 },
    },
    astro: {
      sunrise: "06:04:00",
      sunset: "20:53:00",
      moonrise: "12:45:00",
      moonset: "00:20:00",
      moonPhase: { phase: "First Quarter", illumination: 0.51 },
    },
  },
  {
    date: "2025-07-05",
    conditions: {
      cloudcover: { "0": 4, "6": 3, "12": 2, "18": 2, "21": 1 },
    },
    astro: {
      sunrise: "06:05:00",
      sunset: "20:53:00",
      moonrise: "13:35:00",
      moonset: "01:04:00",
      moonPhase: { phase: "Waxing Gibbous", illumination: 0.64 },
    },
  },
  {
    date: "2025-07-06",
    conditions: {
      cloudcover: { "0": 1, "6": 1, "12": 1, "18": 2, "21": 2 },
    },
    astro: {
      sunrise: "06:05:00",
      sunset: "20:52:00",
      moonrise: "14:28:00",
      moonset: "01:53:00",
      moonPhase: { phase: "Waxing Gibbous", illumination: 0.78 },
    },
  },
  {
    date: "2025-07-07",
    conditions: {
      cloudcover: { "0": 4, "6": 4, "12": 3, "18": 2, "21": 3 },
    },
    astro: {
      sunrise: "06:06:00",
      sunset: "20:52:00",
      moonrise: "15:23:00",
      moonset: "02:47:00",
      moonPhase: { phase: "Full Moon", illumination: 1.0 },
    },
  },
  {
    date: "2025-07-08",
    conditions: {
      cloudcover: { "0": 3, "6": 3, "12": 2, "18": 2, "21": 2 },
    },
    astro: {
      sunrise: "06:06:00",
      sunset: "20:51:00",
      moonrise: "16:19:00",
      moonset: "03:45:00",
      moonPhase: { phase: "Waning Gibbous", illumination: 0.89 },
    },
  },
  {
    date: "2025-07-09",
    conditions: {
      cloudcover: { "0": 1, "6": 2, "12": 1, "18": 1, "21": 1 },
    },
    astro: {
      sunrise: "06:07:00",
      sunset: "20:51:00",
      moonrise: "17:15:00",
      moonset: "04:46:00",
      moonPhase: { phase: "Waning Gibbous", illumination: 0.72 },
    },
  },
  {
    date: "2025-07-10",
    conditions: {
      cloudcover: { "0": 2, "6": 3, "12": 4, "18": 3, "21": 4 },
    },
    astro: {
      sunrise: "06:07:00",
      sunset: "20:50:00",
      moonrise: "18:10:00",
      moonset: "05:49:00",
      moonPhase: { phase: "Last Quarter", illumination: 0.51 },
    },
  },
  {
    date: "2025-07-11",
    conditions: {
      cloudcover: { "0": 4, "6": 4, "12": 3, "18": 2, "21": 2 },
    },
    astro: {
      sunrise: "06:08:00",
      sunset: "20:49:00",
      moonrise: "19:03:00",
      moonset: "06:53:00",
      moonPhase: { phase: "Waning Crescent", illumination: 0.34 },
    },
  },
  {
    date: "2025-07-12",
    conditions: {
      cloudcover: { "0": 1, "6": 1, "12": 1, "18": 1, "21": 1 },
    },
    astro: {
      sunrise: "06:08:00",
      sunset: "20:49:00",
      moonrise: "19:53:00",
      moonset: "07:57:00",
      moonPhase: { phase: "New Moon", illumination: 0.0 },
    },
  },
  {
    date: "2025-07-13",
    conditions: {
      cloudcover: { "0": 2, "6": 2, "12": 2, "18": 2, "21": 2 },
    },
    astro: {
      sunrise: "06:09:00",
      sunset: "20:48:00",
      moonrise: "20:40:00",
      moonset: "09:01:00",
      moonPhase: { phase: "Waxing Crescent", illumination: 0.12 },
    },
  },
  {
    date: "2025-07-14",
    conditions: {
      cloudcover: { "0": 4, "6": 3, "12": 3, "18": 4, "21": 3 },
    },
    astro: {
      sunrise: "06:09:00",
      sunset: "20:47:00",
      moonrise: "21:24:00",
      moonset: "10:03:00",
      moonPhase: { phase: "Waxing Crescent", illumination: 0.22 },
    },
  },
];

/* ======= Payload wrapper matches ApiWeatherData ======= */
export const mockWeatherPayload: ApiWeatherData = {
  status: "ok",
  coordinates: "Mauna Kea, Hawaii",
  timezone: "Pacific/Honolulu",
  timezoneAbbreviation: "HST",
  utcOffsetSeconds: -36000,
  data: mockWeatherData,
};
