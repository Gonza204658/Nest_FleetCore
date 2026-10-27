import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from './maintenance.entity.js';
import { Vehicle } from '../vehicles/vehicle.entity.js';
import { Mechanic } from '../mechanics/mechanic.entity.js';
import { Workshop } from '../workshops/workshop.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Maintenance,
      Vehicle,
      Mechanic,
      Workshop,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class MaintenancesModule {}