import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherModule } from './weather/weather.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';





@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    WeatherModule,
    SupabaseModule.forRoot()
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
