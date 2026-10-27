
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import {
  MaintenanceStatus,
  MaintenanceType,
} from '../common/enums/index.js';

import { Vehicle as VehicleEntity } from '../vehicles/vehicle.entity.js';
import type { Vehicle } from '../vehicles/vehicle.entity.js';

import { Mechanic as MechanicEntity } from '../mechanics/mechanic.entity.js';
import type { Mechanic } from '../mechanics/mechanic.entity.js';

import { Workshop as WorkshopEntity } from '../workshops/workshop.entity.js';
import type { Workshop } from '../workshops/workshop.entity.js';

@Entity('maintenances')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column()
  description: string;

  @Column()
  mileage: number;

  @Column({ type: 'timestamptz' })
  scheduledStart: Date;

  @Column({ type: 'timestamptz' })
  scheduledEnd: Date;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  // Datos de cierre (obligatorios solo al completar)
  @Column({ type: 'text', nullable: true })
  workDone: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  finalCost: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  finalMileage: number | null;

  @ManyToOne(() => VehicleEntity, (v) => v.maintenances, {
    nullable: false,
  })
  vehicle: Relation<Vehicle>;

  @ManyToOne(() => MechanicEntity, (m) => m.maintenances, {
    nullable: false,
  })
  mechanic: Relation<Mechanic>;

  @ManyToOne(() => WorkshopEntity, (w) => w.maintenances, {
    nullable: false,
  })
  workshop: Relation<Workshop>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
