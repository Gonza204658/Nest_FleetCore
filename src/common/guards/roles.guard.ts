import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/index.js';
import { ROLES_KEY } from '../decorators/index.js';

/**
 * Valida que el rol del usuario (req.user.role) esté entre los
 * roles declarados con @Roles(). Si la ruta no declara roles, deja pasar
 * (basta con estar autenticado). Rol no permitido => 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }
    return true;
  }
}