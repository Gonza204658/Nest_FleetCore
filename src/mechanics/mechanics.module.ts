import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mechanic } from './mechanic.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic])],
  exports: [TypeOrmModule],
})
export class MechanicsModule {}