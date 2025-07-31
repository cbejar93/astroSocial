const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

export async function fetchWeather(
  latitude: number,
  longitude: number,
  unit: 'metric' | 'us' = 'metric'
) {
  const res = await fetch(`${API_BASE_URL}/weather`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude, unit }),
  });

  if (!res.ok) throw new Error('Failed to fetch weather data');
  return res.json();
}