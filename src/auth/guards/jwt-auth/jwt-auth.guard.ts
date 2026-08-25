import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser, info?: Error): TUser {
    if (user) {
      return user;
    }
    if (err) {
      throw err;
    }

    const reason = info?.name ?? info?.message;
    if (reason === 'TokenExpiredError') {
      throw new UnauthorizedException('Phiên đã hết hạn');
    }
    if (reason === 'No auth token') {
      throw new UnauthorizedException('No auth token provided');
    }

    throw new UnauthorizedException('Access token không hợp lệ');
  }
}
