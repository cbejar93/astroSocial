export type TimeBlock = "0" | "6" | "12" | "18" | "21";



export const timeBlockDataKeys = {
  temperature: "temperature_2m",
  visibility: "visibility",
  cloudcover: "cloudcover",
  humidity: "relative_humidity_2m",
  precipitation: "precipitation_probability",
  windspeed: "windspeed_10m",
} as const;

interface WeatherConditions {
    temperature?: Record<string, number>;
    visibility?: Record<string, number>;
    cloudcover?: Record<string, number>;
    humidity?: Record<string, number>;
    precipitation?: Record<string, number>;
    windspeed?: Record<string, number>;
  }
  
  export interface AstroData {
    sunrise: string;    // “06:12:34”
    sunset:  string;    // “20:03:21”
    moonrise: string;
    moonset:  string;
    moonPhase: {
      phase: string;        // e.g. “Full Moon”
      illumination: number; // percent 0–100
    };
  }
  
  export interface WeatherDay {
    date:       string;         // “2025-07-11”
    conditions: WeatherConditions;
    astro?:     AstroData;
  }