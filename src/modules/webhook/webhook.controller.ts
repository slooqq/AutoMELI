import { Controller, Post, Body } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  @Post('notifications')
  handleNotification(@Body() payload: unknown): { received: boolean } {
    // TODO: Emit internal event for MessagingModule/TrackerModule
    return { received: true };
  }
}
