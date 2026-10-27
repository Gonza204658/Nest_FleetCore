import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Roles } from '../common/decorators/index.js';
import { EntityStatus, Role } from '../common/enums/index.js';

@ApiTags('Workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly service: WorkshopsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateWorkshopDto) {
    return this.service.create(dto);
  }

  @Get()
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.setStatus(id, EntityStatus.ACTIVE);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/inactivate')
  inactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.setStatus(id, EntityStatus.INACTIVE);
  }
}