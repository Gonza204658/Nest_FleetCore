import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Maintenance } from './maintenance.entity.js';
import { Vehicle } from '../vehicles/vehicle.entity.js';
import { Mechanic } from '../mechanics/mechanic.entity.js';
import { Workshop } from '../workshops/workshop.entity.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { EntityStatus, MaintenanceStatus, Role, VehicleStatus } from '../common/enums/index.js';
import type { AuthUser } from '../common/decorators/index.js';

/** Estados que cuentan como "mantenimiento activo". */
const ACTIVE_STATUSES = [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS];

/** Transiciones válidas. COMPLETED y CANCELLED son estados finales. */
const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

const RELATIONS = { vehicle: true, mechanic: true, workshop: true };

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance) private readonly repo: Repository<Maintenance>,
    @InjectRepository(Vehicle) private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Mechanic) private readonly mechanicsRepo: Repository<Mechanic>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────────────── CREAR ─────────────────────────

  /**
   * Crea un mantenimiento aplicando todas las reglas de negocio.
   * TRANSACCIÓN: se bloquean (pessimistic_write) las filas del vehículo y del
   * mecánico para que dos peticiones simultáneas no puedan saltarse las
   * validaciones de "un solo mantenimiento activo" y "sin cruce de horarios".
   */
  async create(dto: CreateMaintenanceDto) {
    if (dto.scheduledEnd <= dto.scheduledStart) {
      throw new BadRequestException('La fecha de fin programada debe ser posterior a la de inicio');
    }

    const id = await this.dataSource.transaction(async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id: dto.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) throw new NotFoundException(`Vehículo con id ${dto.vehicleId} no encontrado`);
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new ConflictException(`El vehículo ${vehicle.plate} está inactivo`);
      }

      const mechanic = await manager.findOne(Mechanic, {
        where: { id: dto.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) throw new NotFoundException(`Mecánico con id ${dto.mechanicId} no encontrado`);
      if (mechanic.status !== EntityStatus.ACTIVE) {
        throw new ConflictException(`El mecánico ${mechanic.name} está inactivo`);
      }

      const workshop = await manager.findOne(Workshop, { where: { id: dto.workshopId } });
      if (!workshop) throw new NotFoundException(`Taller con id ${dto.workshopId} no encontrado`);
      if (workshop.status !== EntityStatus.ACTIVE) {
        throw new ConflictException(`El taller ${workshop.name} está inactivo`);
      }

      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException(
          `El kilometraje (${dto.mileage}) no puede ser inferior al actual del vehículo (${vehicle.mileage})`,
        );
      }

      // Regla: un vehículo no puede tener más de un mantenimiento activo
      const vehicleBusy = await manager.exists(Maintenance, {
        where: { vehicle: { id: vehicle.id }, status: In(ACTIVE_STATUSES) },
      });
      if (vehicleBusy) {
        throw new ConflictException(`El vehículo ${vehicle.plate} ya tiene un mantenimiento activo`);
      }

      // Regla: el mecánico no puede tener horarios cruzados (en ningún taller).
      // Hay cruce si: inicioExistente < finNuevo  Y  finExistente > inicioNuevo.
      // Si uno termina justo cuando empieza el otro (9:00 y 9:00) NO se cruzan.
      const overlap = await manager
        .getRepository(Maintenance)
        .createQueryBuilder('m')
        .innerJoin('m.mechanic', 'mech')
        .where('mech.id = :mechanicId', { mechanicId: mechanic.id })
        .andWhere('m.status IN (:...active)', { active: ACTIVE_STATUSES })
        .andWhere('m.scheduledStart < :end AND m.scheduledEnd > :start', {
          start: dto.scheduledStart,
          end: dto.scheduledEnd,
        })
        .getOne();
      if (overlap) {
        throw new ConflictException(
          `El mecánico ${mechanic.name} ya tiene un mantenimiento activo que se cruza con ese horario`,
        );
      }

      const maintenance = manager.create(Maintenance, {
        type: dto.type,
        description: dto.description,
        mileage: dto.mileage,
        scheduledStart: dto.scheduledStart,
        scheduledEnd: dto.scheduledEnd,
        status: MaintenanceStatus.SCHEDULED, // estado inicial
        vehicle,
        mechanic,
        workshop,
      });
      return (await manager.save(maintenance)).id;
    });

    return this.loadOne(id);
  }

  // ───────────────────── CAMBIO DE ESTADO ─────────────────────

  /**
   * Cambia el estado validando la máquina de estados y sincroniza la
   * disponibilidad del vehículo. Todo ocurre en UNA transacción: o se guarda
   * el mantenimiento y el vehículo juntos, o no se guarda nada.
   */
  async updateStatus(id: number, dto: UpdateStatusDto, user: AuthUser) {
    await this.dataSource.transaction(async (manager) => {
      // Bloquea la fila para que dos cambios simultáneos no se pisen
      const locked = await manager.findOne(Maintenance, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException(`Mantenimiento con id ${id} no encontrado`);

      const maintenance = await manager.findOneOrFail(Maintenance, {
        where: { id },
        relations: RELATIONS,
      });

      // Un técnico solo puede modificar mantenimientos asignados a él
      if (user.role === Role.TECHNICIAN) {
        const own = await this.getMechanicOf(user);
        if (maintenance.mechanic.id !== own.id) {
          throw new ForbiddenException('Este mantenimiento no está asignado a ti');
        }
      }

      this.assertTransition(maintenance.status, dto.status);

      const vehicle = maintenance.vehicle;

      switch (dto.status) {
        case MaintenanceStatus.IN_PROGRESS:
          if (vehicle.status === VehicleStatus.INACTIVE) {
            throw new ConflictException(`El vehículo ${vehicle.plate} está inactivo`);
          }
          vehicle.status = VehicleStatus.IN_MAINTENANCE;
          break;

        case MaintenanceStatus.COMPLETED:
          this.applyClosure(maintenance, vehicle, dto);
          vehicle.status = VehicleStatus.AVAILABLE;
          break;

        case MaintenanceStatus.CANCELLED:
          // Si estaba en proceso, el vehículo queda libre de nuevo
          if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
            vehicle.status = VehicleStatus.AVAILABLE;
          }
          break;
      }

      maintenance.status = dto.status;
      await manager.save(vehicle);
      await manager.save(maintenance);
    });

    return this.loadOne(id);
  }

  /** Valida la transición y devuelve un mensaje descriptivo si es inválida (409). */
  private assertTransition(from: MaintenanceStatus, to: MaintenanceStatus) {
    if (ALLOWED_TRANSITIONS[from].includes(to)) return;

    if (from === MaintenanceStatus.COMPLETED) {
      throw new ConflictException('Un mantenimiento COMPLETED no puede cambiar de estado');
    }
    if (from === MaintenanceStatus.CANCELLED) {
      throw new ConflictException(`Un mantenimiento CANCELLED no puede cambiar a ${to}`);
    }
    throw new ConflictException(
      `Transición inválida: de ${from} a ${to}. Permitidas desde ${from}: ${ALLOWED_TRANSITIONS[from].join(', ')}`,
    );
  }

  /** Valida y registra los datos obligatorios de cierre. */
  private applyClosure(m: Maintenance, vehicle: Vehicle, dto: UpdateStatusDto) {
    const missing: string[] = [];
    if (!dto.workDone?.trim()) missing.push('workDone');
    if (dto.finalCost === undefined || dto.finalCost === null) missing.push('finalCost');
    if (!dto.finishedAt) missing.push('finishedAt');
    if (dto.finalMileage === undefined || dto.finalMileage === null) missing.push('finalMileage');
    if (missing.length) {
      throw new BadRequestException(
        `Faltan datos obligatorios para completar el mantenimiento: ${missing.join(', ')}`,
      );
    }

    const minMileage = Math.max(vehicle.mileage, m.mileage);
    if (dto.finalMileage! < minMileage) {
      throw new BadRequestException(
        `El kilometraje final (${dto.finalMileage}) no puede ser inferior a ${minMileage}`,
      );
    }

    m.workDone = dto.workDone!.trim();
    m.finalCost = dto.finalCost!;
    m.finishedAt = dto.finishedAt!;
    m.finalMileage = dto.finalMileage!;
    vehicle.mileage = dto.finalMileage!; // el vehículo queda con su kilometraje actualizado
  }

  // ───────────────────────── CONSULTAS ─────────────────────────

  findAll() {
    return this.repo.find({ relations: RELATIONS, order: { scheduledStart: 'DESC' } });
  }

  findActive() {
    return this.repo.find({
      where: { status: In(ACTIVE_STATUSES) },
      relations: RELATIONS,
      order: { scheduledStart: 'ASC' },
    });
  }

  async findByVehicle(vehicleId: number) {
    await this.assertVehicleExists(vehicleId);
    return this.repo.find({
      where: { vehicle: { id: vehicleId } },
      relations: RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** Historial: mantenimientos ya realizados (COMPLETED), del más reciente al más antiguo. */
  async findHistory(vehicleId: number) {
    await this.assertVehicleExists(vehicleId);
    return this.repo.find({
      where: { vehicle: { id: vehicleId }, status: MaintenanceStatus.COMPLETED },
      relations: RELATIONS,
      order: { finishedAt: 'DESC' },
    });
  }

  async findByMechanic(mechanicId: number) {
    if (!(await this.mechanicsRepo.exists({ where: { id: mechanicId } }))) {
      throw new NotFoundException(`Mecánico con id ${mechanicId} no encontrado`);
    }
    return this.repo.find({
      where: { mechanic: { id: mechanicId } },
      relations: RELATIONS,
      order: { scheduledStart: 'DESC' },
    });
  }

  /** Mantenimientos asignados al técnico autenticado (incluye su taller). */
  async findMine(user: AuthUser) {
    const mechanic = await this.getMechanicOf(user);
    return this.findByMechanic(mechanic.id);
  }

  async findOne(id: number, user: AuthUser) {
    const maintenance = await this.loadOne(id);
    if (user.role === Role.TECHNICIAN) {
      const own = await this.getMechanicOf(user);
      if (maintenance.mechanic.id !== own.id) {
        throw new ForbiddenException('Este mantenimiento no está asignado a ti');
      }
    }
    return maintenance;
  }

  // ───────────────────────── HELPERS ─────────────────────────

  private async loadOne(id: number) {
    const maintenance = await this.repo.findOne({ where: { id }, relations: RELATIONS });
    if (!maintenance) throw new NotFoundException(`Mantenimiento con id ${id} no encontrado`);
    return maintenance;
  }

  private async assertVehicleExists(id: number) {
    if (!(await this.vehiclesRepo.exists({ where: { id } }))) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
  }

  /** Mecánico vinculado al usuario técnico autenticado. */
  private async getMechanicOf(user: AuthUser) {
    const mechanic = await this.mechanicsRepo.findOne({ where: { user: { id: user.id } } });
    if (!mechanic) throw new ForbiddenException('Tu usuario no está vinculado a un mecánico');
    return mechanic;
  }
}