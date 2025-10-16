export type TimeBlock =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23';

export interface WeatherConditions {
  temperature?: Partial<Record<TimeBlock, number>>; // Air temperature in °C (metric) or °F (US)
  dewpoint?: Partial<Record<TimeBlock, number>>;    // Dew point in °C (metric) or °F (US)
  visibility?: Partial<Record<TimeBlock, number>>;  // Horizontal visibility in metres
  cloudcover?: Partial<Record<TimeBlock, number>>;  // Total cloud cover as a percent (0–100)
  humidity?: Partial<Record<TimeBlock, number>>;    // Relative humidity percent (0–100)
  precipitation?: Partial<Record<TimeBlock, number>>; // Precipitation probability percent (0–100)
  windspeed?: Partial<Record<TimeBlock, number>>;   // 10 m wind speed in km/h (metric) or mph (US)
  winddirection?: Partial<Record<TimeBlock, number>>; // 10 m wind direction in degrees clockwise from north
  seeing?: Partial<Record<TimeBlock, number>>;      // Boundary layer height in metres (lower is steadier seeing)
  clouds?: Partial<Record<TimeBlock, number>>;      // Legacy qualitative cloud score (unitless)
  transparency?: Partial<Record<TimeBlock, number>>; // Legacy qualitative transparency score (unitless)
}

export interface AstroData {
  sunrise: string;    // “06:12:34”
  sunset: string;     // “20:03:21”
  moonrise?: string;
  moonset?: string;
  moonPhase: {
    phase: string;        // e.g. “Full Moon”
    illumination: number; // percent 0–100
  };
}

export interface WeatherDay {
  date: string;         // ISO date, e.g. “2025-07-11”
  conditions: WeatherConditions;
  astro?: AstroData;
}

export interface WeatherData {
  status: string;
  coordinates: string;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  data: WeatherDay[];
}
