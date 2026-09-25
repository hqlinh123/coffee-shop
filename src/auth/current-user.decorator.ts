import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export type AuthUser = {
  sub: string;
  employeeId: string;
  username: string;
  role: 'EMPLOYEE' | 'MANAGER';
};
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
