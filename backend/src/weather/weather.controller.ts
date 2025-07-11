import { Controller, Post, Body } from '@nestjs/common';
import { WeatherService } from './weather.service'; // adjust the path if needed
import { WeatherDay } from './dto/weather.types';

@Controller('api/weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Post()
  async getWeather(@Body() body: { latitude: number; longitude: number }) {
    const { latitude, longitude } = body;

    console.log(`Received location: ${latitude}, ${longitude}`);

    // Fetch visibility data from Open-Meteo
    const visibilityData = await this.weatherService.fetchVisibility(latitude, longitude);
    const astronomy  = await this.weatherService.fetchAstronomy(latitude, longitude);

    const daily: WeatherDay[] = visibilityData.map(visDay => {
      // find the matching astro object by date
      const astroRaw = astronomy.find(a => a.datetime === visDay.date);

      return {
        date:       visDay.date,
        conditions: visDay.conditions,
        astro: astroRaw && {
          sunrise: astroRaw.sunrise,
          sunset:  astroRaw.sunset,
          moonrise: astroRaw.moonrise,
          moonset:  astroRaw.moonset,
          moonPhase: {
            phase:        mapPhaseName(astroRaw.moonphase),
            illumination: Math.round(astroRaw.moonphase * 100),
          },
        },
      };
    });

    // console.log(daily);

    return { status:'ok', coordinates:{ latitude, longitude }, data:daily };
  }
}

function mapPhaseName(fraction: number): string {
  if (fraction === 0)              return 'New Moon';
  if (fraction > 0   && fraction < 0.25) return 'Waxing Crescent';
  if (fraction === 0.25)           return 'First Quarter';
  if (fraction > 0.25 && fraction < 0.5)  return 'Waxing Gibbous';
  if (fraction === 0.5)            return 'Full Moon';
  if (fraction > 0.5  && fraction < 0.75) return 'Waning Gibbous';
  if (fraction === 0.75)           return 'Last Quarter';
  if (fraction > 0.75 && fraction < 1)    return 'Waning Crescent';
  return 'New Moon';
}