import { useEffect, useState } from 'react';
import { fetchWeather } from './weatherApi';
import type { WeatherData } from '../types/weather';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const DEFAULT_LOCATION: Coordinates = {
  latitude: 37.8044,
  longitude: -122.2712,
};

const TIMEZONE_LOCATIONS: Record<
  string,
  {
    coordinates: Coordinates;
    displayName: string;
  }
> = {
  'America/New_York': {
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    displayName: 'New York City, NY',
  },
  'America/Chicago': {
    coordinates: {
      latitude: 41.8781,
      longitude: -87.6298,
    },
    displayName: 'Chicago, IL',
  },
  'America/Denver': {
    coordinates: {
      latitude: 39.7392,
      longitude: -104.9903,
    },
    displayName: 'Denver, CO',
  },
  'America/Los_Angeles': {
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    displayName: 'Los Angeles, CA',
  },
};

export const useWeatherService = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'metric' | 'us'>('metric');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
      },
      (err) => {
        console.error(err);

        if (err.code === err.PERMISSION_DENIED) {
          const timeZone =
            typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function'
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : undefined;
          const fallbackLocation = timeZone ? TIMEZONE_LOCATIONS[timeZone] : undefined;

          if (fallbackLocation) {
            setLocation(fallbackLocation.coordinates);
            return;
          }

          setLocation(DEFAULT_LOCATION);
          return;
        }

        setError('Failed to retrieve location.');
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    fetchWeather(location.latitude, location.longitude, unit)
      .then(setWeather)
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch weather data.');
      })
      .finally(() => setLoading(false));
  }, [location, unit]);

  return {
    location,
    weather,
    loading,
    error,
    unit,
    setUnit,
  };
};