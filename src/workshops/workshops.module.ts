import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workshop } from './workshop.entity.js';
import { WorkshopsService } from './workshops.service.js';
import { WorkshopsController } from './workshops.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop])],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
  exports: [TypeOrmModule, WorkshopsService],
})
export class WorkshopsModule {}