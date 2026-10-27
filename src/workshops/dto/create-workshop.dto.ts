import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Norte' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Calle 85 # 50-20, Barranquilla' })
  @IsString()
  @IsNotEmpty()
  address: string;
}