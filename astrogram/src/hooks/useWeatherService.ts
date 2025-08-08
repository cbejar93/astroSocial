import { useEffect, useState } from 'react';
import { fetchWeather } from './weatherApi';
import type { WeatherData } from '../pages/WeatherPage';

type Coordinates = {
  latitude: number;
  longitude: number;
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