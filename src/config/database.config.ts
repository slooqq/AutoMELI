import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Token } from '../modules/auth/entities/token.entity';
import { Credential } from '../modules/auth/entities/credential.entity';
import { CompetitorItem } from '../modules/tracker/entities/competitor-item.entity';
import { CompetitorSnapshot } from '../modules/tracker/entities/competitor-snapshot.entity';
import { TestVariant } from '../modules/ab-testing/entities/test-variant.entity';
import { TestResult } from '../modules/ab-testing/entities/test-result.entity';

export function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || './data/meli.db',
    entities: [
      Token,
      Credential,
      CompetitorItem,
      CompetitorSnapshot,
      TestVariant,
      TestResult,
    ],
    synchronize: true,
  };
}
