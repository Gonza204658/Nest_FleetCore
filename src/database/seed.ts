import { NestFactory } from '@nestjs/core';
import {
  DataSource, DeepPartial, EntityManager, EntityTarget, FindOptionsWhere, ObjectLiteral,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module.js';
import { User } from '../users/User.entity.js';
import { Mechanic } from '../mechanics/mechanic.entity.js';
import { Workshop } from '../workshops/workshop.entity.js';
import { Vehicle } from '../vehicles/vehicle.entity.js';
import { Maintenance } from '../maintenances/maintenance.entity.js';
import {
  EntityStatus, MaintenanceStatus, MaintenanceType, Role, VehicleStatus,
} from '../common/enums/index.js';

/**
 * Busca por clave natural (email, placa, nombre...) y solo crea si no existe.
 * Así ejecutar el seeder varias veces NO duplica registros.
 */
async function findOrCreate<T extends ObjectLiteral>(
  m: EntityManager,
  entity: EntityTarget<T>,
  where: FindOptionsWhere<T>,
  data: DeepPartial<T>,
): Promise<T> {
  const existing = await m.findOne(entity, { where });
  if (existing) return existing;
  return m.save(entity, m.create(entity, data) as any) as Promise<T>;
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const dataSource = app.get(DataSource);

  // Todo en una transacción: si algo falla, no queda data a medias
  await dataSource.transaction(async (m) => {
    // ── Usuarios ──
    const hash = (p: string) => bcrypt.hash(p, 10);
    const admin = await findOrCreate(m, User, { email: 'admin@fleetcore.com' }, {
      name: 'Administrador', email: 'admin@fleetcore.com',
      password: await hash('Admin123*'), role: Role.ADMIN,
    });
    const tech1 = await findOrCreate(m, User, { email: 'tecnico1@fleetcore.com' }, {
      name: 'Carlos Pérez', email: 'tecnico1@fleetcore.com',
      password: await hash('Tecnico123*'), role: Role.TECHNICIAN,
    });
    const tech2 = await findOrCreate(m, User, { email: 'tecnico2@fleetcore.com' }, {
      name: 'Laura Gómez', email: 'tecnico2@fleetcore.com',
      password: await hash('Tecnico123*'), role: Role.TECHNICIAN,
    });

    // ── Mecánicos: 2 activos vinculados a los técnicos y 1 inactivo ──
    const mech1 = await findOrCreate(m, Mechanic, { email: 'carlos.perez@fleetcore.com' }, {
      name: 'Carlos Pérez', email: 'carlos.perez@fleetcore.com',
      specialty: 'Motor y transmisión', status: EntityStatus.ACTIVE, user: tech1,
    });
    const mech2 = await findOrCreate(m, Mechanic, { email: 'laura.gomez@fleetcore.com' }, {
      name: 'Laura Gómez', email: 'laura.gomez@fleetcore.com',
      specialty: 'Frenos y suspensión', status: EntityStatus.ACTIVE, user: tech2,
    });
    await findOrCreate(m, Mechanic, { email: 'pedro.ruiz@fleetcore.com' }, {
      name: 'Pedro Ruiz', email: 'pedro.ruiz@fleetcore.com',
      specialty: 'Electricidad', status: EntityStatus.INACTIVE, user: null,
    });

    // ── Talleres: 1 activo y 1 inactivo ──
    const workshop1 = await findOrCreate(m, Workshop, { name: 'Taller Centro' }, {
      name: 'Taller Centro', address: 'Calle 30 # 20-15, Barranquilla',
      status: EntityStatus.ACTIVE,
    });
    await findOrCreate(m, Workshop, { name: 'Taller Norte' }, {
      name: 'Taller Norte', address: 'Calle 85 # 50-20, Barranquilla',
      status: EntityStatus.INACTIVE,
    });

    // ── Vehículos: 2 AVAILABLE, 1 IN_MAINTENANCE y 1 INACTIVE ──
    const v1 = await findOrCreate(m, Vehicle, { plate: 'ABC123' }, {
      plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2022,
      mileage: 45100, status: VehicleStatus.AVAILABLE,
    });
    const v2 = await findOrCreate(m, Vehicle, { plate: 'DEF456' }, {
      plate: 'DEF456', brand: 'Hino', model: '500', year: 2021,
      mileage: 30500, status: VehicleStatus.AVAILABLE,
    });
    const v3 = await findOrCreate(m, Vehicle, { plate: 'GHI789' }, {
      plate: 'GHI789', brand: 'Isuzu', model: 'NQR', year: 2020,
      mileage: 80000, status: VehicleStatus.IN_MAINTENANCE,
    });
    await findOrCreate(m, Vehicle, { plate: 'JKL012' }, {
      plate: 'JKL012', brand: 'Renault', model: 'Master', year: 2019,
      mileage: 120000, status: VehicleStatus.INACTIVE,
    });

    // ── Mantenimientos ──
    // IN_PROGRESS del vehículo en mantenimiento
    await findOrCreate(
      m, Maintenance,
      { description: 'Revisión de motor y transmisión', vehicle: { id: v3.id } },
      {
        type: MaintenanceType.CORRECTIVE,
        description: 'Revisión de motor y transmisión',
        mileage: 80000,
        scheduledStart: new Date('2026-10-27T07:30:00.000Z'),
        scheduledEnd: new Date('2026-10-27T11:00:00.000Z'),
        status: MaintenanceStatus.IN_PROGRESS,
        vehicle: v3, mechanic: mech2, workshop: workshop1,
      },
    );

    // COMPLETED (historial)
    await findOrCreate(
      m, Maintenance,
      { description: 'Cambio de aceite y filtros', vehicle: { id: v1.id } },
      {
        type: MaintenanceType.PREVENTIVE,
        description: 'Cambio de aceite y filtros',
        mileage: 45000,
        scheduledStart: new Date('2026-09-15T14:00:00.000Z'),
        scheduledEnd: new Date('2026-09-15T16:30:00.000Z'),
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Cambio de aceite y filtros',
        finalCost: 350000,
        finishedAt: new Date('2026-09-15T16:30:00.000Z'),
        finalMileage: 45100,
        vehicle: v1, mechanic: mech1, workshop: workshop1,
      },
    );
    await findOrCreate(
      m, Maintenance,
      { description: 'Reemplazo de pastillas de freno', vehicle: { id: v2.id } },
      {
        type: MaintenanceType.CORRECTIVE,
        description: 'Reemplazo de pastillas de freno',
        mileage: 30000,
        scheduledStart: new Date('2026-10-10T12:00:00.000Z'),
        scheduledEnd: new Date('2026-10-10T14:00:00.000Z'),
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Reemplazo de pastillas de freno',
        finalCost: 480000,
        finishedAt: new Date('2026-10-10T14:00:00.000Z'),
        finalMileage: 30500,
        vehicle: v2, mechanic: mech2, workshop: workshop1,
      },
    );

    void admin; // el admin solo necesita existir
  });

  console.log('✅ Seed completado');
  await app.close();
}

seed().catch((err) => {
  console.error('❌ Error ejecutando el seed:', err);
  process.exit(1);
});