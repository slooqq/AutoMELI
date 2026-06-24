import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Token } from '../modules/auth/entities/token.entity';
import { Credential } from '../modules/auth/entities/credential.entity';
import { CompetitorItem } from '../modules/tracker/entities/competitor-item.entity';
import { CompetitorSnapshot } from '../modules/tracker/entities/competitor-snapshot.entity';
import { TestVariant } from '../modules/ab-testing/entities/test-variant.entity';
import { TestResult } from '../modules/ab-testing/entities/test-result.entity';

const entities = [
  Token,
  Credential,
  CompetitorItem,
  CompetitorSnapshot,
  TestVariant,
  TestResult,
];

export function databaseConfig(): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  // En producción usa PostgreSQL (Railway), en local usa SQLite
  if (isProduction && databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities,
      // En producción sincronizamos automáticamente las tablas en el primer deploy.
      // Cuando el proyecto madure, cambiar a migraciones manuales.
      synchronize: true,
      logging: false,
      ssl: { rejectUnauthorized: false }, // Requerido por Railway Postgres
    };
  }

  return {
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || './data/meli.db',
    entities,
    synchronize: true,
    logging: true,
  };
}
