import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@thefirstspine/auth-nest';

@Injectable()
export class ApiGuard extends AuthGuard {

  static readonly excludeForMethods: string[] = [
    'getGame',
    'getQueue',
  ];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (ApiGuard.excludeForMethods.includes(context.switchToHttp().getRequest()?.body?.method)) {
      return true;
    }

    return super.canActivate(context);
  }
}
