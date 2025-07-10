import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';



import { firstValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  constructor(private http: HttpService) {}

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
    return response.data; // includes arrays: time[], visibility[]
  }
}