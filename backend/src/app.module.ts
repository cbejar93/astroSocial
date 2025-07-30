import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherModule } from './weather/weather.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { PrismaModule }   from './prisma/prisma.module';
import { AuthModule }    from './auth/auth.module';
import { RequestLoggingMiddleware }  from './middleware/logging.middleware';
import { PostsModule } from './posts/post.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';




@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    WeatherModule,
    SupabaseModule.forRoot(),
    PrismaModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    NotificationsModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');  // or limit to certain controllers
  }
}
