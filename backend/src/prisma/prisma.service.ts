import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient }                             from '@prisma/client';

/**
 * Connection pool size is controlled via the DATABASE_URL query parameter:
 *   ?connection_limit=<N>&pool_timeout=10
 *
 * Recommended values:
 *   - Single instance:  connection_limit=20
 *   - Multi-instance:   connection_limit=10  (per replica)
 *
 * Set DATABASE_CONNECTION_LIMIT env var to override the default of 20 at runtime.
 * This value is appended to the DATABASE_URL only if connection_limit is not already set.
 */
function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL ?? '';
  if (!base || base.includes('connection_limit=')) return base;
  const limit = process.env.DATABASE_CONNECTION_LIMIT ?? '20';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}connection_limit=${limit}&pool_timeout=10`;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ datasources: { db: { url: buildDatasourceUrl() } } });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}