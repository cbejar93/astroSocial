import { Module } from '@nestjs/common';
import { OgController } from './og.controller';
import { OgService } from './og.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OgController],
  providers: [OgService],
})
export class OgModule {}
