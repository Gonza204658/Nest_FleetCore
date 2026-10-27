
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { EntityStatus } from '../common/enums/index.js';
import { Maintenance } from '../maintenances/maintenance.entity.js';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  status: EntityStatus;

  @OneToMany(() => Maintenance, (m) => m.workshop)
  maintenances: Relation<Maintenance[]>;

  @CreateDateColumn()
  createdAt: Date;
}
