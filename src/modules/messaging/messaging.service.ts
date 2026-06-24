import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MessageTemplate } from './entities/message-template.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(MessageTemplate)
    private templateRepo: Repository<MessageTemplate>,
    private authService: AuthService,
  ) {}

  async getTemplates(): Promise<MessageTemplate[]> {
    return this.templateRepo.find();
  }

  async createTemplate(keyword: string, response: string): Promise<MessageTemplate> {
    const template = this.templateRepo.create({ keyword, response });
    return this.templateRepo.save(template);
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.templateRepo.delete(id);
  }

  async processNotification(resource: string): Promise<void> {
    try {
      this.logger.log(`Procesando notificación de mensajería: ${resource}`);
      const token = await this.authService.getValidToken();

      // Consultar el mensaje o el paquete de mensajes
      const url = `https://api.mercadolibre.com${resource}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Extraer los mensajes dependiendo del formato de la respuesta
      let messages = [];
      if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages;
      } else if (data.id) {
        messages = [data]; // Es un solo mensaje
      }

      if (messages.length === 0) return;

      // Ordenar por fecha (el más reciente primero)
      messages.sort((a: any, b: any) => {
        const dateA = a.message_date?.created || a.date_created || 0;
        const dateB = b.message_date?.created || b.date_created || 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      const latestMessage = messages[0];

      // Ignorar si el mensaje fue enviado por el propio vendedor
      const sellerIdStr = resource.match(/sellers\/(\d+)/)?.[1]; // Intenta sacar el seller_id de la URL
      const senderId = latestMessage.from?.user_id?.toString();
      
      // Si el senderId coincide con el sellerId de la URL, somos nosotros
      if (sellerIdStr && senderId === sellerIdStr) {
        this.logger.log('El último mensaje fue enviado por el vendedor. Ignorando.');
        return;
      }

      const text = latestMessage.text?.plain || latestMessage.text || '';
      this.logger.log(`Texto del mensaje recibido: ${text}`);

      // Buscar si alguna palabra clave coincide
      const templates = await this.templateRepo.find({ where: { active: true } });
      const lowerText = text.toLowerCase();
      
      let matchedTemplate = null;
      for (const t of templates) {
        if (lowerText.includes(t.keyword.toLowerCase())) {
          matchedTemplate = t;
          break;
        }
      }

      if (matchedTemplate) {
        this.logger.log(`Palabra clave encontrada: '${matchedTemplate.keyword}'. Respondiendo...`);
        
        let packId = resource.match(/packs\/(\d+)/)?.[1];
        let sellerId = sellerIdStr;
        let buyerId = latestMessage.from?.user_id;

        if (latestMessage.message_resources && latestMessage.message_resources.length > 0) {
           packId = latestMessage.message_resources[0].id; // fallback por si la URL no tenía packs/
        }

        if (packId && sellerId) {
          const replyUrl = `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`;
          await axios.post(
            replyUrl,
            {
              from: { user_id: sellerId },
              to: { user_id: buyerId },
              text: matchedTemplate.response,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          this.logger.log(`Respuesta enviada exitosamente al comprador ${buyerId}.`);
        } else {
          this.logger.warn('No se pudo extraer pack_id o seller_id para enviar la respuesta.');
        }
      } else {
        this.logger.log('No se encontraron palabras clave en el mensaje.');
      }

    } catch (error: any) {
      this.logger.error(`Error procesando notificación de mensaje: ${error.message}`);
      if (error.response) {
        this.logger.error(`ML API Error: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}
