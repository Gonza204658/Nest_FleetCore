import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/index.js';

export const ROLES_KEY = 'roles';

/** Declara los roles permitidos para una ruta o controlador. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);