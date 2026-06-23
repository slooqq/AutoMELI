import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AbTestingService } from './ab-testing.service';
import { TestVariant } from './entities/test-variant.entity';
import { TestResult } from './entities/test-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestVariant, TestResult]),
    ScheduleModule,
  ],
  providers: [AbTestingService],
})
export class AbTestingModule {}
