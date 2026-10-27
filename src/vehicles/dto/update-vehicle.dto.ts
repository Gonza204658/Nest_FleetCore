import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

// El estado NO se edita aquí: lo controlan los mantenimientos y activate/inactivate
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}