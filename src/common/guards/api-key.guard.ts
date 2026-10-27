import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Autenticación por header x-api-key para integraciones externas.
 * Las llaves válidas viven en la variable de entorno API_KEYS (separadas por coma).
 * Se usa junto con @Public() para saltar el JWT.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeys: string[];

  constructor(config: ConfigService) {
    this.validKeys = (config.get<string>('API_KEYS') ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) throw new UnauthorizedException('API Key no proporcionada');
    if (!this.validKeys.includes(apiKey)) throw new UnauthorizedException('API Key incorrecta');
    return true;
  }
}