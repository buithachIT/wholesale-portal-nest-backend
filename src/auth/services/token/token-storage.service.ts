import { EntityStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { flattenRolesPermissions } from '@/auth/utils/flatten-roles-permissions';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import { parseDurationMs } from '@/auth/utils/parse-duration';

export interface UserTokenPayload {
  id: number;
  email: string;
  companyId: number | null;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiresAt(): Date {
    const value = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    const ttl = parseDurationMs(value);
    if (ttl == null || ttl <= 0) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_EXPIRES_IN không hợp lệ',
      );
    }
    return new Date(Date.now() + ttl);
  }

  async generateTokens(
    user: UserTokenPayload,
    options?: { replaceTokenId?: bigint },
  ) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_ACCESS_SECRET is not configured',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue,
    });
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const hashedRefreshToken = this.hashToken(rawRefreshToken);
    const expiresAt = this.refreshExpiresAt();

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashedRefreshToken,
          expiresAt,
        },
      });

      if (options?.replaceTokenId != null) {
        await tx.refreshToken.update({
          where: { id: options.replaceTokenId },
          data: {
            revokedAt: new Date(),
            replacedByTokenId: created.id,
          },
        });
      }
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async rotateRefreshToken(refreshToken: string) {
    const hashedRefreshToken = this.hashToken(refreshToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashedRefreshToken },
      include: {
        user: {
          include: {
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
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ, vui lòng đăng nhập lại',
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token đã hết hạn, vui lòng đăng nhập lại',
      );
    }

    if (tokenRecord.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revokedAt: new Date() },
      });

      throw new ForbiddenException(
        'Phát hiện hành vi bất thường. Vui lòng đăng nhập lại',
      );
    }
    if (tokenRecord.user.status === EntityStatus.suspended) {
      throw new ForbiddenException('Tài khoản đã bị tạm khóa');
    }

    const { roles, permissions } = flattenRolesPermissions(
      tokenRecord.user.userRoles,
    );

    return this.generateTokens(
      {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        companyId: tokenRecord.user.companyId,
        roles,
        permissions,
      },
      { replaceTokenId: tokenRecord.id },
    );
  }

  async revokeRefreshToken(userId: number, rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Đăng xuất thành công' };
  }
}
