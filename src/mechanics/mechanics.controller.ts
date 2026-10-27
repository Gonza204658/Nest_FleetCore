import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MechanicsService } from './mechanics.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Roles } from '../common/decorators/index.js';
import { EntityStatus, Role } from '../common/enums/index.js';

@ApiTags('Mechanics')
@ApiBearerAuth()
@Roles(Role.ADMIN) // todo el controlador es solo para ADMIN
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly service: MechanicsService) {}

  @Post()
  create(@Body() dto: CreateMechanicDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMechanicDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.setStatus(id, EntityStatus.ACTIVE);
  }

  @Patch(':id/inactivate')
  inactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.setStatus(id, EntityStatus.INACTIVE);
  }
}