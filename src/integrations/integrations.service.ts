import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity.js';
import { Maintenance } from '../maintenances/maintenance.entity.js';
import { MaintenanceStatus, VehicleStatus } from '../common/enums/index.js';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Maintenance) private readonly maintenancesRepo: Repository<Maintenance>,
  ) {}

  async getVehicleHistory(plate: string) {
    const vehicle = await this.vehiclesRepo.findOne({ where: { plate: plate.toUpperCase() } });
    if (!vehicle) throw new NotFoundException(`Vehículo con placa ${plate} no encontrado`);

    const maintenances = await this.maintenancesRepo.find({
      where: { vehicle: { id: vehicle.id }, status: MaintenanceStatus.COMPLETED },
      relations: { mechanic: true, workshop: true },
      order: { finishedAt: 'DESC' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: maintenances.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.workDone,
        mileage: m.finalMileage,
        cost: m.finalCost,
        finishedAt: m.finishedAt,
        mechanic: { id: m.mechanic.id, name: m.mechanic.name },
        workshop: { id: m.workshop.id, name: m.workshop.name },
      })),
    };
  }
}