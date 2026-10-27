import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { MaintenanceType } from '../../common/enums/index.js';

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45000, description: 'Kilometraje del vehículo al ingresar' })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: '2026-11-03T07:30:00.000Z' })
  @Type(() => Date)
  @IsDate()
  scheduledStart: Date;

  @ApiProperty({ example: '2026-11-03T09:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  scheduledEnd: Date;

  @ApiProperty({ example: 1 })
  @IsInt()
  vehicleId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  mechanicId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  workshopId: number;
}