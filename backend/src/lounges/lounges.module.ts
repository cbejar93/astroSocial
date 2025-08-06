import { Module } from '@nestjs/common';
import { LoungesService } from './lounges.service';
import { LoungesController } from './lounges.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [PrismaModule, SupabaseModule.forRoot()],
  providers: [LoungesService, StorageService],
  controllers: [LoungesController],
})
export class LoungesModule {}
