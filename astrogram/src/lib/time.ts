export interface TimeParts {
  hour: number;
  minute: number;
}

export const parseTimeParts = (value?: string): TimeParts | null => {
  if (!value) return null;
  const [timeSection] = value.includes("T") ? value.split("T").slice(-1) : [value];
  const [hour, minute] = timeSection.split(":");
  const parsedHour = Number.parseInt(hour ?? "", 10);
  const parsedMinute = Number.parseInt(minute ?? "", 10);
  if (Number.isNaN(parsedHour) || Number.isNaN(parsedMinute)) return null;
  return { hour: parsedHour, minute: parsedMinute };
};

export const isWithinDaylight = (
  sunrise: string,
  sunset: string,
  currentHour: number,
  currentMinute: number,
): boolean => {
  const sunriseParts = parseTimeParts(sunrise);
  const sunsetParts = parseTimeParts(sunset);
  if (!sunriseParts || !sunsetParts) return true;

  const sunriseMinutes = sunriseParts.hour * 60 + sunriseParts.minute;
  const sunsetMinutes = sunsetParts.hour * 60 + sunsetParts.minute;
  const currentMinutes = currentHour * 60 + currentMinute;

  if (sunsetMinutes === sunriseMinutes) {
    return currentMinutes === sunriseMinutes;
  }

  if (sunsetMinutes < sunriseMinutes) {
    return currentMinutes >= sunriseMinutes || currentMinutes < sunsetMinutes;
  }

  return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
};

const toTwoDigit = (value: number): string => value.toString().padStart(2, "0");

export const formatTimeForUnit = (
  value: string,
  unit: "metric" | "us",
): string => {
  const parts = parseTimeParts(value);
  if (!parts) return value;

  const { hour, minute } = parts;

  if (unit === "us") {
    const normalizedHour = ((hour % 24) + 24) % 24;
    const period = normalizedHour >= 12 ? "PM" : "AM";
    const twelveHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
    return `${twelveHour}:${toTwoDigit(minute)} ${period}`;
  }

  return `${toTwoDigit(hour)}:${toTwoDigit(minute)}`;
};

export const formatHourLabel = (hour: number, unit: "metric" | "us"): string => {
  const normalizedHour = ((hour % 24) + 24) % 24;

  if (unit === "us") {
    const period = normalizedHour >= 12 ? "PM" : "AM";
    const twelveHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
    return `${twelveHour} ${period}`;
  }

  return `${normalizedHour}H`;
};
