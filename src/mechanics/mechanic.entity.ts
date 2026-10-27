
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { EntityStatus } from '../common/enums/index.js';
import { User } from '../users/User.entity.js';
import { Maintenance } from '../maintenances/maintenance.entity.js';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  specialty: string;

  @Column({
    type: 'enum',
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  status: EntityStatus;

  // Vínculo con el usuario técnico (para "mis mantenimientos")
  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user: Relation<User> | null;

  @OneToMany(() => Maintenance, (m) => m.mechanic)
  maintenances: Relation<Maintenance[]>;

  @CreateDateColumn()
  createdAt: Date;
}
