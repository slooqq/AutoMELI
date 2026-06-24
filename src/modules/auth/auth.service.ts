import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { Token } from './entities/token.entity';
import { Credential } from './entities/credential.entity';

@Injectable()
export class AuthService {
  private readonly MELI_OAUTH_URL = 'https://auth.mercadolibre.com.co/authorization';
  private readonly MELI_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
  
  // Almacenamos el code_verifier temporalmente en memoria para el flujo de un solo usuario
  private currentCodeVerifier: string = '';

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    private readonly configService: ConfigService,
  ) {}

  generateAuthUrl(): string {
    const appId = this.configService.getOrThrow<string>('MELI_APP_ID');
    const redirectUri = this.configService.getOrThrow<string>('MELI_REDIRECT_URI');

    // Generamos PKCE
    this.currentCodeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(this.currentCodeVerifier)
      .digest('base64url');

    const params = new URLSearchParams();
    params.append('client_id', appId);
    params.append('response_type', 'code');
    params.append('redirect_uri', redirectUri);
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');

    return `${this.MELI_OAUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<Token> {
    const appId = this.configService.getOrThrow<string>('MELI_APP_ID');
    const secretKey = this.configService.getOrThrow<string>('MELI_SECRET_KEY');
    const redirectUri = this.configService.getOrThrow<string>('MELI_REDIRECT_URI');

    if (!this.currentCodeVerifier) {
      throw new InternalServerErrorException('Falta el code_verifier. Debes iniciar el flujo desde /auth/login.');
    }

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('client_id', appId);
    body.append('client_secret', secretKey);
    body.append('code', code);
    body.append('redirect_uri', redirectUri);
    body.append('code_verifier', this.currentCodeVerifier);

    try {
      const { data } = await axios.post<MeliTokenResponse>(
        this.MELI_TOKEN_URL,
        body,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      const token = this.tokenRepository.create({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      });

      return this.tokenRepository.save(token);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? JSON.stringify(error.response?.data)
        : (error as Error).message;
      throw new InternalServerErrorException('Failed to exchange authorization code', message);
    }
  }

  async refreshToken(): Promise<Token> {
    const [existingToken] = await this.tokenRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (!existingToken) {
      throw new InternalServerErrorException('No token found to refresh');
    }

    const appId = this.configService.getOrThrow<string>('MELI_APP_ID');
    const secretKey = this.configService.getOrThrow<string>('MELI_SECRET_KEY');

    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('client_id', appId);
    body.append('client_secret', secretKey);
    body.append('refresh_token', existingToken.refreshToken);

    try {
      const { data } = await axios.post<MeliTokenResponse>(
        this.MELI_TOKEN_URL,
        body,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      existingToken.accessToken = data.access_token;
      existingToken.refreshToken = data.refresh_token;
      existingToken.expiresAt = new Date(Date.now() + data.expires_in * 1000);

      return this.tokenRepository.save(existingToken);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? JSON.stringify(error.response?.data)
        : (error as Error).message;
      throw new InternalServerErrorException('Failed to refresh token', message);
    }
  }

  async getValidToken(): Promise<string> {
    const [token] = await this.tokenRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (!token) {
      throw new InternalServerErrorException('No token available');
    }

    if (new Date() >= token.expiresAt) {
      const refreshed = await this.refreshToken();
      return refreshed.accessToken;
    }

    return token.accessToken;
  }

  async saveCredentials(appId: string, secretKey: string, redirectUri: string): Promise<Credential> {
    const credential = this.credentialRepository.create({
      appId,
      secretKey,
      redirectUri,
    });

    return this.credentialRepository.save(credential);
  }
}

interface MeliTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  user_id: number;
}
