
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { VehicleStatus } from '../common/enums/index.js';
import { Maintenance } from '../maintenances/maintenance.entity.js';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  plate: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column({ default: 0 })
  mileage: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @OneToMany(() => Maintenance, (m) => m.vehicle)
  maintenances: Relation<Maintenance[]>;

  @CreateDateColumn()
  createdAt: Date;
}
