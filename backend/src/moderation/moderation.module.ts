import { Module }         from '@nestjs/common'
import { AnalyticsModule } from "src/analytics/analytics.module";





@Module({
  imports: [

    AnalyticsModule,

  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class PostsModule {}