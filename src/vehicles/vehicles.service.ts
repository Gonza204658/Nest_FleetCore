import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleStatus } from '../common/enums/index.js';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>) {}

  async create(dto: CreateVehicleDto) {
    await this.assertPlateFree(dto.plate);
    return this.repo.save(this.repo.create({ ...dto, status: VehicleStatus.AVAILABLE }));
  }

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const vehicle = await this.repo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    return vehicle;
  }

  async findByPlate(plate: string) {
    const vehicle = await this.repo.findOne({ where: { plate: plate.toUpperCase() } });
    if (!vehicle) throw new NotFoundException(`Vehículo con placa ${plate} no encontrado`);
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);
    if (dto.plate && dto.plate !== vehicle.plate) await this.assertPlateFree(dto.plate);
    return this.repo.save(Object.assign(vehicle, dto));
  }

  /** Eliminación lógica: pasa a INACTIVE, conserva el historial de mantenimientos. */
  async inactivate(id: number) {
    const vehicle = await this.findOne(id);
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException('No se puede inactivar un vehículo que está en mantenimiento');
    }
    vehicle.status = VehicleStatus.INACTIVE;
    return this.repo.save(vehicle);
  }

  async activate(id: number) {
    const vehicle = await this.findOne(id);
    if (vehicle.status === VehicleStatus.INACTIVE) {
      vehicle.status = VehicleStatus.AVAILABLE;
    }
    return this.repo.save(vehicle);
  }

  private async assertPlateFree(plate: string) {
    if (await this.repo.exists({ where: { plate } })) {
      throw new ConflictException(`Ya existe un vehículo con la placa ${plate}`);
    }
  }
}