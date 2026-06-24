import { Controller, Post, Body, Logger } from '@nestjs/common';
import { MessagingService } from '../messaging/messaging.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private messagingService: MessagingService) {}

  @Get('notifications')
  verify(): { status: string; expected: string } {
    return {
      status: 'active',
      expected: 'MercadoLibre sends POST notifications here',
    };
  }

  @Post('notifications')
  async handleNotification(@Body() payload: any): Promise<{ received: boolean }> {
    this.logger.log(`Webhook recibido: ${JSON.stringify(payload)}`);

    if (payload.topic === 'messages' && payload.resource) {
      // MercadoLibre espera una respuesta rápida 200 OK. Procesamos asíncronamente.
      this.messagingService.processNotification(payload.resource).catch((err) => {
        this.logger.error(`Error procesando mensaje en background: ${err.message}`);
      });
    }

    return { received: true };
  }
}
