import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestVariant } from './entities/test-variant.entity';
import { TestResult } from './entities/test-result.entity';

@Injectable()
export class AbTestingService {
  private readonly logger = new Logger(AbTestingService.name);

  constructor(
    @InjectRepository(TestVariant)
    private readonly variantRepository: Repository<TestVariant>,
    @InjectRepository(TestResult)
    private readonly resultRepository: Repository<TestResult>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rotateVariants(): Promise<void> {
    // TODO: Rotate titles/images for active tests
    this.logger.log('A/B test rotation job executed');
  }
}
