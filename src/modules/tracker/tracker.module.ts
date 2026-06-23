import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TrackerService } from './tracker.service';
import { CompetitorItem } from './entities/competitor-item.entity';
import { CompetitorSnapshot } from './entities/competitor-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompetitorItem, CompetitorSnapshot]),
    ScheduleModule,
  ],
  providers: [TrackerService],
})
export class TrackerModule {}
