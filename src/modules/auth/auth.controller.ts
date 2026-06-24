import { Controller, Get, Query, Redirect, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Redirige al usuario a MercadoLibre para autorizar la app.
   * Visita: GET /auth/login
   */
  @Get('login')
  @Redirect()
  login(): { url: string } {
    const url = this.authService.generateAuthUrl();
    this.logger.log(`Redirigiendo a MercadoLibre: ${url}`);
    return { url };
  }

  /**
   * MercadoLibre redirige aquí después de que el usuario autoriza.
   * Guarda el token de acceso en la base de datos.
   * Visita: GET /auth/callback?code=XXXXX
   */
  @Get('callback')
  async callback(@Query('code') code: string): Promise<{ message: string }> {
    if (!code) {
      return { message: 'Error: no se recibió código de autorización.' };
    }

    this.logger.log(`Código de autorización recibido, intercambiando por token...`);
    const token = await this.authService.exchangeCode(code);
    this.logger.log(`Token guardado. Expira: ${token.expiresAt}`);

    return { message: '✅ Autenticación exitosa. Ya puedes cerrar esta ventana.' };
  }

  /**
   * Endpoint de diagnóstico temporal para ver qué variables lee el servidor.
   * Visita: GET /auth/debug
   */
  @Get('debug')
  debug() {
    const appId = process.env.MELI_APP_ID || '';
    return {
      NODE_ENV: process.env.NODE_ENV || 'no-set',
      MELI_APP_ID_EXISTS: !!appId,
      MELI_APP_ID_LENGTH: appId.length,
      MELI_APP_ID_PREVIEW: appId ? `${appId.slice(0, 3)}...***` : 'vacío',
      MELI_REDIRECT_URI: process.env.MELI_REDIRECT_URI || 'no-set',
    };
  }
}
