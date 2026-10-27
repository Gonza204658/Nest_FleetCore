import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MaintenancesService } from './maintenances.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';
import type { AuthUser } from '../common/decorators/index.js';
import { Role } from '../common/enums/index.js';

@ApiTags('Maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly service: MaintenancesService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMaintenanceDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN)
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  // Rutas estáticas ANTES de ':id'
  @Roles(Role.TECHNICIAN)
  @Get('my')
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user);
  }

  @Roles(Role.ADMIN)
  @Get('vehicle/:vehicleId/history')
  findHistory(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.service.findHistory(vehicleId);
  }

  @Roles(Role.ADMIN)
  @Get('vehicle/:vehicleId')
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.service.findByVehicle(vehicleId);
  }

  @Roles(Role.ADMIN)
  @Get('mechanic/:mechanicId')
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.service.findByMechanic(mechanicId);
  }

  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }

  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto, user);
  }
}