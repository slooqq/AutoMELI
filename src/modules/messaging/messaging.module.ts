import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MessageTemplate } from './entities/message-template.entity';
import { AuthModule } from '../auth/auth.module';
import { MessagingController } from './messaging.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplate]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
