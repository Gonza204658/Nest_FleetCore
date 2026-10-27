import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

/** Inyecta el usuario autenticado (req.user). Uso: @CurrentUser() user  o  @CurrentUser('id') id */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as AuthUser;
    return field ? user?.[field] : user;
  },
);