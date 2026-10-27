import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from './maintenance.entity.js';
import { Vehicle } from '../vehicles/vehicle.entity.js';
import { Mechanic } from '../mechanics/mechanic.entity.js';
import { Workshop } from '../workshops/workshop.entity.js';
import { MaintenancesService } from './maintenances.service.js';
import { MaintenancesController } from './maintenances.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance, Vehicle, Mechanic, Workshop])],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [TypeOrmModule, MaintenancesService],
})
export class MaintenancesModule {}