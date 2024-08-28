import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@thefirstspine/auth-nest';

@Injectable()
export class ApiGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context);
  }
}
