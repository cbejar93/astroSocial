import { Module, DynamicModule, Logger } from '@nestjs/common';
import { ConfigService, ConfigModule }  from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_TOKEN = 'SUPABASE_CLIENT';

@Module({})
export class SupabaseModule {
  private static readonly logger = new Logger(SupabaseModule.name);

  static forRoot(): DynamicModule {
    this.logger.log('Initializing SupabaseModule…');

    const supabaseProvider = {
      provide: SUPABASE_TOKEN,
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('SUPA_URL');
        const key = cfg.get<string>('SUPA_KEY');

        if (!url || !key) {
          this.logger.error(
            'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment',
          );
          throw new Error(
            'SupabaseModule: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set try new',
          );
        }

        this.logger.log(`Supabase URL loaded: ${url}`);
        this.logger.log(`Creating Supabase client…`);

        const client = createClient(url, key);

        this.logger.log(`Supabase client created successfully`);
        return client;
      },
      inject: [ConfigService],
    };

    this.logger.log('SupabaseModule configured with provider `' + SUPABASE_TOKEN + '`');

    return {
      module: SupabaseModule,
      imports: [ConfigModule],
      providers: [supabaseProvider],
      exports: [supabaseProvider],
    };
  }
}