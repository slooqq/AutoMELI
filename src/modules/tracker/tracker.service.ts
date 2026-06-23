import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorItem } from './entities/competitor-item.entity';
import { CompetitorSnapshot } from './entities/competitor-snapshot.entity';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  constructor(
    @InjectRepository(CompetitorItem)
    private readonly competitorItemRepository: Repository<CompetitorItem>,
    @InjectRepository(CompetitorSnapshot)
    private readonly snapshotRepository: Repository<CompetitorSnapshot>,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async trackCompetitors(): Promise<void> {
    // TODO: Query MeLi API for each tracked ITEM_ID and save snapshots
    this.logger.log('Competitor tracking job executed');
  }
}
