import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging/templates')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  async getTemplates() {
    return this.messagingService.getTemplates();
  }

  @Post()
  async createTemplate(@Body() data: { keyword: string; response: string }) {
    return this.messagingService.createTemplate(data.keyword, data.response);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    return this.messagingService.deleteTemplate(parseInt(id));
  }
}
