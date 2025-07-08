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

export interface WeatherData {
  date: string;
  sight: WeatherConditionLevel;
  clear: WeatherConditionLevel;
  clouds: WeatherConditionLevel;
}

export const conditionColors = {
    1: "bg-gray-600",   // Worst
    2: "bg-yellow-500",
    3: "bg-blue-500",
    4: "bg-green-500",  // Best
  };



  export type TimeBlock = '0'|"6" | "12" | "18" | '21';

  export interface WeatherDay {
    date: string;
    conditions: {
      clouds: Record<TimeBlock, number>;
      seeing: Record<TimeBlock, number>;
      transparency: Record<TimeBlock, number>;
    };
    moonPhase: {
      phase: string;
      illumination: number;
    };
  }
  
  export const mockWeatherData: WeatherDay[] = [
    {
      date: "2025-07-03",
      conditions: {
        clouds: { "0": 3, "6": 2, "12": 3, "18": 1, "21": 2 },
        seeing: { "0": 2, "6": 3, "12": 2, "18": 4, "21": 3 },
        transparency: { "0": 1, "6": 4, "12": 1, "18": 2, "21": 3 },
      },
      moonPhase: { phase: "Waxing Crescent", illumination: 0.42 },
    },
    {
      date: "2025-07-04",
      conditions: {
        clouds: { "0": 2, "6": 1, "12": 4, "18": 3, "21": 2 },
        seeing: { "0": 3, "6": 2, "12": 3, "18": 1, "21": 2 },
        transparency: { "0": 4, "6": 3, "12": 2, "18": 4, "21": 3 },
      },
      moonPhase: { phase: "First Quarter", illumination: 0.51 },
    },
    {
      date: "2025-07-05",
      conditions: {
        clouds: { "0": 4, "6": 3, "12": 2, "18": 2, "21": 1 },
        seeing: { "0": 3, "6": 4, "12": 4, "18": 3, "21": 4 },
        transparency: { "0": 2, "6": 2, "12": 1, "18": 2, "21": 3 },
      },
      moonPhase: { phase: "Waxing Gibbous", illumination: 0.64 },
    },
    {
      date: "2025-07-06",
      conditions: {
        clouds: { "0": 1, "6": 1, "12": 1, "18": 2, "21": 2 },
        seeing: { "0": 4, "6": 2, "12": 3, "18": 4, "21": 4 },
        transparency: { "0": 3, "6": 4, "12": 4, "18": 3, "21": 2 },
      },
      moonPhase: { phase: "Waxing Gibbous", illumination: 0.78 },
    },
    {
      date: "2025-07-07",
      conditions: {
        clouds: { "0": 4, "6": 4, "12": 3, "18": 2, "21": 3 },
        seeing: { "0": 1, "6": 1, "12": 2, "18": 3, "21": 2 },
        transparency: { "0": 2, "6": 2, "12": 3, "18": 4, "21": 3 },
      },
      moonPhase: { phase: "Full Moon", illumination: 1.0 },
    },
    {
      date: "2025-07-08",
      conditions: {
        clouds: { "0": 3, "6": 3, "12": 2, "18": 2, "21": 2 },
        seeing: { "0": 2, "6": 4, "12": 4, "18": 3, "21": 3 },
        transparency: { "0": 4, "6": 3, "12": 2, "18": 1, "21": 2 },
      },
      moonPhase: { phase: "Waning Gibbous", illumination: 0.89 },
    },
    {
      date: "2025-07-09",
      conditions: {
        clouds: { "0": 1, "6": 2, "12": 1, "18": 1, "21": 1 },
        seeing: { "0": 4, "6": 4, "12": 3, "18": 3, "21": 4 },
        transparency: { "0": 3, "6": 4, "12": 3, "18": 4, "21": 4 },
      },
      moonPhase: { phase: "Waning Gibbous", illumination: 0.72 },
    },
    {
      date: "2025-07-10",
      conditions: {
        clouds: { "0": 2, "6": 3, "12": 4, "18": 3, "21": 4 },
        seeing: { "0": 2, "6": 3, "12": 2, "18": 1, "21": 1 },
        transparency: { "0": 1, "6": 2, "12": 3, "18": 2, "21": 2 },
      },
      moonPhase: { phase: "Last Quarter", illumination: 0.51 },
    },
    {
      date: "2025-07-11",
      conditions: {
        clouds: { "0": 4, "6": 4, "12": 3, "18": 2, "21": 2 },
        seeing: { "0": 1, "6": 2, "12": 2, "18": 3, "21": 3 },
        transparency: { "0": 3, "6": 3, "12": 4, "18": 3, "21": 3 },
      },
      moonPhase: { phase: "Waning Crescent", illumination: 0.34 },
    },
    {
      date: "2025-07-12",
      conditions: {
        clouds: { "0": 1, "6": 1, "12": 1, "18": 1, "21": 1 },
        seeing: { "0": 4, "6": 4, "12": 4, "18": 4, "21": 4 },
        transparency: { "0": 4, "6": 4, "12": 4, "18": 4, "21": 4 },
      },
      moonPhase: { phase: "New Moon", illumination: 0.0 },
    },
    {
      date: "2025-07-13",
      conditions: {
        clouds: { "0": 2, "6": 2, "12": 2, "18": 2, "21": 2 },
        seeing: { "0": 3, "6": 3, "12": 3, "18": 3, "21": 3 },
        transparency: { "0": 2, "6": 2, "12": 2, "18": 2, "21": 2 },
      },
      moonPhase: { phase: "Waxing Crescent", illumination: 0.12 },
    },
    {
      date: "2025-07-14",
      conditions: {
        clouds: { "0": 4, "6": 3, "12": 3, "18": 4, "21": 3 },
        seeing: { "0": 1, "6": 2, "12": 2, "18": 1, "21": 1 },
        transparency: { "0": 3, "6": 2, "12": 1, "18": 1, "21": 2 },
      },
      moonPhase: { phase: "Waxing Crescent", illumination: 0.22 },
    },
  ];
  