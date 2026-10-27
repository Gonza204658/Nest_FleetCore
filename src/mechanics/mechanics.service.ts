import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mechanic } from './mechanic.entity.js';
import { User } from '../users/User.entity.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { EntityStatus, Role } from '../common/enums/index.js';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic) private readonly repo: Repository<Mechanic>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateMechanicDto) {
    await this.assertEmailFree(dto.email);
    const { userId, ...data } = dto;
    const user = userId !== undefined ? await this.resolveTechnician(userId) : null;
    return this.repo.save(this.repo.create({ ...data, user }));
  }

  findAll() {
    return this.repo.find({ relations: { user: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const mechanic = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!mechanic) throw new NotFoundException(`Mecánico con id ${id} no encontrado`);
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto) {
    const mechanic = await this.findOne(id);
    if (dto.email && dto.email !== mechanic.email) await this.assertEmailFree(dto.email);

    const { userId, ...data } = dto;
    Object.assign(mechanic, data);
    if (userId !== undefined) mechanic.user = await this.resolveTechnician(userId, id);
    return this.repo.save(mechanic);
  }

  /** Activar/inactivar. No borra nada: el historial de mantenimientos se conserva. */
  async setStatus(id: number, status: EntityStatus) {
    const mechanic = await this.findOne(id);
    mechanic.status = status;
    return this.repo.save(mechanic);
  }

  private async assertEmailFree(email: string) {
    if (await this.repo.exists({ where: { email } })) {
      throw new ConflictException(`Ya existe un mecánico con el correo ${email}`);
    }
  }

  /** El usuario debe existir, ser TECHNICIAN y no estar vinculado a otro mecánico. */
  private async resolveTechnician(userId: number, mechanicId?: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException('El usuario vinculado debe tener rol TECHNICIAN');
    }
    const linked = await this.repo.findOne({ where: { user: { id: userId } } });
    if (linked && linked.id !== mechanicId) {
      throw new ConflictException('Ese usuario ya está vinculado a otro mecánico');
    }
    return user;
  }
}