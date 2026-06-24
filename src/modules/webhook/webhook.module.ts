import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
