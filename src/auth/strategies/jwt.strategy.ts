import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { EntityStatus } from '@/generated/prisma/enums';
import { flattenRolesPermissions } from '@/auth/utils/flatten-roles-permissions';

export interface JwtPayload {
  sub: number;
  email: string;
  companyId: number | null;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
        companyId: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
    }
    if (user.status === EntityStatus.suspended) {
      throw new ForbiddenException('Tài khoản đã bị tạm khóa');
    }

    const { roles, permissions } = flattenRolesPermissions(user.userRoles);

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      roles,
      permissions,
    };
  }
}

export type AuthenticatedUser = {
  id: number;
  email: string;
  companyId: number | null;
  roles: string[];
  permissions: string[];
};
