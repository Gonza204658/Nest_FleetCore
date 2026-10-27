import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from './decorators/index.js';
import { ApiKeyGuard } from './guards/index.js';
import { Role } from './enums/index.js';

@ApiTags('Test (temporal)')
@Controller('test')
export class TestController {
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin-only')
  adminOnly() {
    return { ok: 'Solo ADMIN' };
  }

  @ApiSecurity('api-key')
  @Public() // salta el JWT
  @UseGuards(ApiKeyGuard)
  @Get('api-key')
  apiKey() {
    return { ok: 'API Key válida' };
  }
}