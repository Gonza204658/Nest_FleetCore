import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workshop } from './workshop.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop])],
  exports: [TypeOrmModule],
})
export class WorkshopsModule {}