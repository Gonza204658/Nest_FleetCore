import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from '../vehicles/vehicle.entity.js';
import { Maintenance } from '../maintenances/maintenance.entity.js';
import { IntegrationsService } from './integrations.service.js';
import { IntegrationsController } from './integrations.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Maintenance])],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}