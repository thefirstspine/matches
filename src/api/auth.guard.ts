import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { AuthService } from '@thefirstspine/auth-nest';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const bearerToken = context
      .switchToHttp()
      .getRequest()
      ?.headers?.authorization?.replace('Bearer ', '');
    if (!bearerToken) {
      return true;
    }

    const userId: number = await this.authService.me(bearerToken);
    if (!userId) {
      return true;
    }

    context.switchToHttp().getRequest().user = userId;
    context.switchToHttp().getRequest().authToken = bearerToken;

    return true;
  }
}
