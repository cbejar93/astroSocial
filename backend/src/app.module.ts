import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherModule } from './weather/weather.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RequestLoggingMiddleware } from './middleware/logging.middleware';
import { PostsModule } from './posts/post.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoungesModule } from './lounges/lounges.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HttpModule,
    WeatherModule,
    SupabaseModule.forRoot(),
    PrismaModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    NotificationsModule,
    LoungesModule,
    SearchModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestLoggingMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*'); // or limit to certain controllers
  }
}
