import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WeatherService } from './weather.service'; // adjust the path if needed
import { WeatherDay } from './dto/weather.types';

@Controller('api/weather')
export class WeatherController {

  private readonly logger = new Logger(WeatherController.name);

  constructor(private weatherService: WeatherService) {}

  @Post()
  async getWeather(@Body() body: { latitude: number; longitude: number }) {
    const { latitude, longitude } = body;

    this.logger.log(`Received request for weather at [${latitude}, ${longitude}]`);


    const start = Date.now();

    this.logger.log('Starting parallel fetch of visibility, astronomy & location');

    // Fetch visibility data from Open-Meteo
       // fire all three requests at once
       const [ visibilityData, astronomy, location ] = await Promise.all([
        this.weatherService.fetchVisibility(latitude, longitude),
        this.weatherService.fetchAstronomy(latitude, longitude),
        this.weatherService.fetchLocationName(latitude, longitude),
      ]);

      const duration = Date.now() - start;


      this.logger.log(
        `Fetched data in ${duration}ms → ` +
        `visibility days: ${visibilityData.length}, ` +
        `astronomy days: ${astronomy.length}, ` +
        `location: ${location}`
      );

   
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

    this.logger.log(`Returning payload with ${daily.length} days of data`);

    return { status:'ok', coordinates:location, data:daily };
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