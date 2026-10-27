import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/enums/index.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // hash, nunca texto plano

  @Column({ type: 'enum', enum: Role, default: Role.TECHNICIAN })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}