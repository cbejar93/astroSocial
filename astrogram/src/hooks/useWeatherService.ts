import { useEffect, useState } from 'react';
import { fetchWeather } from './weatherApi';

type Coordinates = {
  latitude: number;
  longitude: number;
};

export const useWeatherService = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);

        try {
          const data = await fetchWeather(coords.latitude, coords.longitude);
          setWeather(data);
        } catch (err) {
          console.error(err);
          setError('Failed to fetch weather data.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Failed to retrieve location.');
        setLoading(false);
      }
    );
  }, []);

  return {
    location,
    weather,
    loading,
    error,
  };
};