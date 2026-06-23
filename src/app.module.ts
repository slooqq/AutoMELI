import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { TrackerModule } from './modules/tracker/tracker.module';
import { AbTestingModule } from './modules/ab-testing/ab-testing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    WebhookModule,
    MessagingModule,
    TrackerModule,
    AbTestingModule,
  ],
})
export class AppModule {}
