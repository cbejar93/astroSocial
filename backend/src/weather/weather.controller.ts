import { Controller, Post, Body } from '@nestjs/common';
import { WeatherService } from './weather.service'; // adjust the path if needed

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

    console.log(astronomy);

    return {
      status: 'ok',
      coordinates: { latitude, longitude },
      data: visibilityData,
    };
  }
}