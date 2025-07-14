// weather.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService }               from '@nestjs/axios';
import { ConfigService }             from '@nestjs/config';
import { firstValueFrom }            from 'rxjs';
import { CACHE_MANAGER }             from '@nestjs/cache-manager';
import type { Cache }                from 'cache-manager';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private config: ConfigService,
    private http: HttpService,
  ) {
    const key = this.apiKey;
    this.logger.log(`VisualCrossing API key loaded: ${key ? '✅ present' : '❌ missing'}`);
  }

  private get apiKey(): string {
    return this.config.get<string>('VC_API_KEY') as string;
  }

  private getAstroKey(lat: number, lon: number) {
    return `astronomy:${lat}:${lon}`;
  }

  async fetchVisibility(lat: number, lon: number) {
    this.logger.log(`▶️ fetchVisibility start for [${lat},${lon}]`);

    try {
      const response = await firstValueFrom(
        this.http.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude:  lat,
            longitude: lon,
            timezone:  'auto',
            hourly: [
              'temperature_2m',
              'visibility',
              'cloudcover',
              'relative_humidity_2m',
              'precipitation_probability',
              'windspeed_10m',
            ].join(','),
          },
        }),
      );
      this.logger.log(`🌤️  Open-Meteo returned ${response.data.hourly.time.length} entries`);

      const hourly    = response.data.hourly;
      const timeBlocks = new Set([0,3, 6, 12, 18, 21]);
      const resultMap: Record<string, any> = {};

      for (let i = 0; i < hourly.time.length; i++) {
        const dt   = new Date(hourly.time[i]);
        const hr   = dt.getHours();
        if (!timeBlocks.has(hr)) continue;
        const dateKey = dt.toISOString().split('T')[0];

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

        resultMap[dateKey].conditions.temperature[hr]    = hourly.temperature_2m[i];
        resultMap[dateKey].conditions.visibility[hr]     = hourly.visibility[i];
        resultMap[dateKey].conditions.cloudcover[hr]     = hourly.cloudcover[i];
        resultMap[dateKey].conditions.humidity[hr]       = hourly.relative_humidity_2m[i];
        resultMap[dateKey].conditions.precipitation[hr]  = hourly.precipitation_probability[i];
        resultMap[dateKey].conditions.windspeed[hr]      = hourly.windspeed_10m[i];
      }

      const result = Object.values(resultMap);
      this.logger.log(`✅ fetchVisibility complete for [${lat},${lon}] with ${result.length} days`);
      return result;

    } catch (err) {
      this.logger.error(`❌ fetchVisibility failed for [${lat},${lon}]`, (err as Error).stack);
      throw err;
    }
  }

  async fetchAstronomy(lat: number, lon: number) {
    const cacheKey = this.getAstroKey(lat, lon);
    this.logger.log(`▶️ fetchAstronomy start for [${lat},${lon}], key=${cacheKey}`);

    // 1) try cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`♻️  fetchAstronomy cache hit for ${cacheKey}`);
      return cached;
    }

    // 2) fetch from Visual Crossing
    if (!this.apiKey) {
      this.logger.error('🔑 VisualCrossing API key missing!');
      throw new Error('VC_API_KEY not configured');
    }

    try {
      this.logger.log(`🌙 Calling Visual Crossing for [${lat},${lon}]`);
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}`;
      const resp = await firstValueFrom(
        this.http.get(url, {
          params: {
            unitGroup:   'us',
            include:     'days',
            elements:    'datetime,sunrise,sunset,moonphase,moonrise,moonset',
            key:         this.apiKey,
            contentType: 'json',
          },
        }),
      );

      const days = resp.data.days;
      this.logger.log(`✅ Visual Crossing returned ${days.length} days`);
      await this.cache.set(cacheKey, days, 3600);
      this.logger.log(`💾 Cached astronomy data for ${cacheKey} (1h TTL)`);
      return days;

    } catch (err) {
      this.logger.error(`❌ fetchAstronomy failed for [${lat},${lon}]`, (err as Error).stack);
      throw err;
    }
  }

  async fetchLocationName(lat: number, lon: number): Promise<string> {
    const cacheKey = `loc:${lat}:${lon}`;
    this.logger.log(`▶️ fetchLocationName for [${lat},${lon}]`);

    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.log(`♻️  fetchLocationName cache hit for ${cacheKey}: ${cached}`);
      return cached;
    }

    try {
      const url = 'https://nominatim.openstreetmap.org/reverse';
      this.logger.log(`🌐 Calling Nominatim for [${lat},${lon}]`);
      const resp = await firstValueFrom(
        this.http.get(url, {
          params: { format: 'json', lat, lon, addressdetails: 1 },
          headers: {
            'User-Agent': 'ColliMate/1.0 (+https://astrosocial.fly.dev)',
          },
        }),
      );

      console.log('=======')
      console.log(resp.data);
      console.log('=======')


      const addr = resp.data.address || {};
      let city = addr.city
        || addr.town
        || addr.village
        || addr.county
        || addr.state
        || 'Unknown location';

      city+= ', ' + addr.state;

      await this.cache.set(cacheKey, city, 86400);
      this.logger.log(`💾 Cached location ${cacheKey}: ${city} (24h TTL)`);
      return city;

    } catch (err) {
      this.logger.error(`❌ fetchLocationName failed for [${lat},${lon}]`, (err as Error).stack);
      return 'Unknown location';
    }
  }
}
