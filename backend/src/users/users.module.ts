import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService }    from './users.service';
import { PrismaModule }    from '../prisma/prisma.module';
import { SupabaseModule }  from '../supabase/supabase.module';
import { StorageService } from '../storage/storage.service';


@Module({
  imports: [
    PrismaModule,
    SupabaseModule.forRoot(),

  ],
  controllers: [UsersController],
  providers: [UsersService, StorageService],
  exports: [UsersService],
})
export class UsersModule {}