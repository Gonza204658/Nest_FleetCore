import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service.js';
import { Public } from '../common/decorators/index.js';
import { ApiKeyGuard } from '../common/guards/index.js';

/**
 * Endpoints para sistemas externos. @Public() salta el JWT global y
 * ApiKeyGuard exige un header x-api-key válido (llaves en API_KEYS del .env).
 */
@ApiTags('Integrations')
@ApiSecurity('api-key')
@Public()
@UseGuards(ApiKeyGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('vehicles/:plate/maintenances')
  getVehicleHistory(@Param('plate') plate: string) {
    return this.service.getVehicleHistory(plate);
  }
}