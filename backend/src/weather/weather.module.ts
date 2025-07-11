import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { CacheModule }  from '@nestjs/cache-manager';  

@Module({
  imports: [HttpModule,
    CacheModule.register({
          ttl: 300,    // default seconds to cache
          max: 100,    // max number of items in memory
        }),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}