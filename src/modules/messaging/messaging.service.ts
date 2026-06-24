import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MessageTemplate } from './entities/message-template.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(MessageTemplate)
    private templateRepo: Repository<MessageTemplate>,
    private authService: AuthService,
  ) {}

  async onModuleInit() {
    const count = await this.templateRepo.count();
    if (count === 0) {
      const defaults = [
        { keyword: 'precio', response: 'Hola, el precio del artículo es el publicado en la publicación. No tenemos precios especiales por esta vía, todo se gestiona directamente a través de MercadoLibre. ¡Saludos!' },
        { keyword: 'envío', response: 'Hola, el envío se realiza a través de MercadoEnvíos. El costo y tiempo de entrega se calculan automáticamente al ingresar tu código postal en la publicación. ¡Saludos!' },
        { keyword: 'envio', response: 'Hola, el envío se realiza a través de MercadoEnvíos. El costo y tiempo de entrega se calculan automáticamente al ingresar tu código postal en la publicación. ¡Saludos!' },
        { keyword: 'disponible', response: 'Hola, sí tenemos stock disponible del producto. Puedes realizar la compra directamente por MercadoLibre y lo procesaremos a la brevedad. ¡Saludos!' },
        { keyword: 'stock', response: 'Hola, sí tenemos stock disponible del producto. Puedes realizar la compra directamente por MercadoLibre y lo procesaremos a la brevedad. ¡Saludos!' },
        { keyword: 'medidas', response: 'Hola, las medidas exactas están especificadas en la publicación. Si necesitas más detalles, por favor indícanos qué información adicional requieres. ¡Saludos!' },
        { keyword: 'garantía', response: 'Hola, el producto incluye la garantía legal de MercadoLibre. Ante cualquier inconveniente, puedes abrir un reclamo desde la plataforma. ¡Saludos!' },
        { keyword: 'garantia', response: 'Hola, el producto incluye la garantía legal de MercadoLibre. Ante cualquier inconveniente, puedes abrir un reclamo desde la plataforma. ¡Saludos!' },
        { keyword: 'negociable', response: 'Hola, los precios son los publicados en la plataforma. No realizamos negociaciones por fuera de MercadoLibre. Puedes revisar nuestras otras publicaciones para más opciones. ¡Saludos!' },
        { keyword: 'horario', response: 'Hola, nuestro horario de atención es de lunes a viernes de 9:00 a 18:00. Los pedidos realizados fuera de este horario se procesan al siguiente día hábil. ¡Saludos!' },
        { keyword: 'demora', response: 'Hola, el tiempo de preparación del pedido es de 1 a 3 días hábiles. Luego el envío depende del código postal y la agencia seleccionada. ¡Saludos!' },
        { keyword: 'factura', response: 'Hola, emitimos factura electrónica por todas las compras realizadas a través de MercadoLibre. Puedes descargarla desde la plataforma una vez concretada la venta. ¡Saludos!' },
      ];
      await this.templateRepo.save(defaults);
      this.logger.log(`${defaults.length} plantillas de auto-respuesta creadas por defecto`);
    }
  }

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
