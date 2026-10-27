import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { MaintenanceStatus } from '../../common/enums/index.js';

export class UpdateStatusDto {
  @ApiProperty({ enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  // Datos de cierre: obligatorios solo cuando status = COMPLETED (lo valida el service)
  @ApiPropertyOptional({ example: 'Cambio de aceite y filtros' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  workDone?: string;

  @ApiPropertyOptional({ example: 350000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalCost?: number;

  @ApiPropertyOptional({ example: '2026-11-03T09:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  finishedAt?: Date;

  @ApiPropertyOptional({ example: 45100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  finalMileage?: number;
}