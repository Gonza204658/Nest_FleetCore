import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workshop } from './workshop.entity.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { EntityStatus } from '../common/enums/index.js';

@Injectable()
export class WorkshopsService {
  constructor(@InjectRepository(Workshop) private readonly repo: Repository<Workshop>) {}

  create(dto: CreateWorkshopDto) {
    return this.repo.save(this.repo.create(dto));
  }

  /** Solo talleres activos (requisito del enunciado). */
  findActive() {
    return this.repo.find({ where: { status: EntityStatus.ACTIVE }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const workshop = await this.repo.findOne({ where: { id } });
    if (!workshop) throw new NotFoundException(`Taller con id ${id} no encontrado`);
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto) {
    const workshop = await this.findOne(id);
    return this.repo.save(Object.assign(workshop, dto));
  }

  async setStatus(id: number, status: EntityStatus) {
    const workshop = await this.findOne(id);
    workshop.status = status;
    return this.repo.save(workshop);
  }
}