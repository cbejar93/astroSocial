import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';



import { firstValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  constructor( private config: ConfigService, private http: HttpService) {}

  private get apiKey() {
    return this.config.get<string>('VC_API_KEY');
  }

  async fetchVisibility(lat: number, lon: number) {
    const response = await firstValueFrom(
      this.http.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          timezone: 'auto',
          hourly: [
            'temperature_2m',
            'visibility',
            'cloudcover',
            'relative_humidity_2m',
            'precipitation_probability',
            'windspeed_10m',
          ].join(','),
        },
      })
    );

    const hourly = response.data.hourly;
    const timeBlocks = new Set([0, 6, 12, 18, 21]);

    const resultMap: Record<string, any> = {};

    for (let i = 0; i < hourly.time.length; i++) {
      const time = new Date(hourly.time[i]);
      const hour = time.getHours();
      if (!timeBlocks.has(hour)) continue;

      const dateKey = time.toISOString().split('T')[0];

      if (!resultMap[dateKey]) {
        resultMap[dateKey] = {
          date: dateKey,
          conditions: {
            temperature: {},
            visibility: {},
            cloudcover: {},
            humidity: {},
            precipitation: {},
            windspeed: {},
          },
        };
      }

      resultMap[dateKey].conditions.temperature[hour] = hourly.temperature_2m[i];
      resultMap[dateKey].conditions.visibility[hour] = hourly.visibility[i];
      resultMap[dateKey].conditions.cloudcover[hour] = hourly.cloudcover[i];
      resultMap[dateKey].conditions.humidity[hour] = hourly.relative_humidity_2m[i];
      resultMap[dateKey].conditions.precipitation[hour] = hourly.precipitation_probability[i];
      resultMap[dateKey].conditions.windspeed[hour] = hourly.windspeed_10m[i];
    }

    return Object.values(resultMap);
  }

  async fetchAstronomy(lat: number, lon: number) {
    const key = this.apiKey;

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}`;

    const response = await firstValueFrom(
      this.http.get(url, {
        params: {
          unitGroup: 'us',
          include: 'days',
          elements: 'datetime,sunrise,sunset,moonphase,moonrise,moonset',
          key: key,
          contentType: 'json',
        },
      }),
    );

    // returns an array of { datetime, sunrise, sunset, moonphase, moonrise, moonset }
    return response.data.days;
  }

}