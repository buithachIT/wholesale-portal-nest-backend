import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { EntityStatus } from '@/generated/prisma/enums';
import { TokenService } from './services/token/token-storage.service';
import { flattenRolesPermissions } from './utils/flatten-roles-permissions';

const INVALID_CREDENTIALS = 'Email hoặc mật khẩu không chính xác';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: LoginDto) {
    const foundUser = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!foundUser) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const isMatchPassword = await bcrypt.compare(
      dto.password,
      foundUser.password,
    );
    if (!isMatchPassword) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (foundUser.status === EntityStatus.suspended) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const { roles, permissions } = flattenRolesPermissions(foundUser.userRoles);
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens({
        id: foundUser.id,
        email: foundUser.email,
        companyId: foundUser.companyId,
        roles,
        permissions,
      });

    return {
      accessToken,
      refreshToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        companyId: foundUser.companyId,
        roles,
        permissions,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async logout(userId: number, refreshToken: string) {
    return this.tokenService.revokeRefreshToken(userId, refreshToken);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const { roles, permissions } = flattenRolesPermissions(user.userRoles);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      company: user.company,
      roles,
      permissions,
    };
  }
}
