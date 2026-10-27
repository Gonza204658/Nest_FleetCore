import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Frenos y suspensión' })
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @ApiPropertyOptional({ description: 'Id del usuario TECHNICIAN vinculado' })
  @IsOptional()
  @IsInt()
  userId?: number;
}