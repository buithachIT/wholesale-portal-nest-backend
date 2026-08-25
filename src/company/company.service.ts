import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '@/auth/strategies/jwt.strategy';
import { Prisma } from '@/generated/prisma/client';
import { EntityStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RegisterCompanyUserDto } from './dto/register-company-user.dto';

const PURCHASER_ROLE = 'PURCHASER';

const userPublicSelect = {
  id: true,
  email: true,
  fullName: true,
  status: true,
  companyId: true,
} as const;

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterCompanyDto, actor: AuthenticatedUser) {
    if (actor.companyId != null) {
      throw new ForbiddenException(
        'Chỉ nhân viên nội bộ được cấp tài khoản doanh nghiệp',
      );
    }

    const email = dto.email.trim().toLowerCase();
    await this.assertEmailAvailable(email);
    const purchaserRole = await this.prisma.role.findUnique({
      where: { name: PURCHASER_ROLE },
    });
    if (!purchaserRole) {
      throw new InternalServerErrorException('Chưa cấu hình role PURCHASER.');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const company = await this.prisma.company.create({
        data: {
          name: dto.name.trim(),
          phone: dto.phone?.trim() || null,
          users: {
            create: {
              email,
              password: passwordHash,
              fullName: dto.fullName.trim(),
              status: EntityStatus.active,
              userRoles: {
                create: {
                  roleId: purchaserRole.id,
                },
              },
            },
          },
        },
        include: {
          users: {
            select: userPublicSelect,
          },
        },
      });

      const user = company.users[0];
      if (!user) {
        throw new InternalServerErrorException(
          'Không tạo được tài khoản doanh nghiệp',
        );
      }

      return {
        company: {
          id: company.id,
          name: company.name,
          phone: company.phone,
          creditLimit: company.creditLimit.toString(),
          remainingCredit: company.remainingCredit.toString(),
          walletBalance: company.walletBalance.toString(),
          createdAt: company.createdAt,
        },
        user: {
          ...user,
          role: PURCHASER_ROLE,
        },
      };
    } catch (error) {
      this.rethrowUniqueEmail(error);
    }
  }

  async createUser(
    companyId: number,
    dto: RegisterCompanyUserDto,
    actor: AuthenticatedUser,
  ) {
    if (actor.companyId != null && actor.companyId !== companyId) {
      throw new ForbiddenException(
        'Không được cấp tài khoản cho doanh nghiệp khác',
      );
    }

    const targetCompanyId = actor.companyId ?? companyId;
    const company = await this.prisma.company.findUnique({
      where: { id: targetCompanyId },
    });
    if (!company) {
      throw new NotFoundException('Không tìm thấy doanh nghiệp');
    }

    const email = dto.email.trim().toLowerCase();
    await this.assertEmailAvailable(email);
    const role = await this.requireRole(dto.role);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: passwordHash,
          fullName: dto.fullName.trim(),
          status: EntityStatus.active,
          companyId: company.id,
          userRoles: {
            create: {
              roleId: role.id,
            },
          },
        },
        select: userPublicSelect,
      });

      return {
        ...user,
        role: role.name,
      };
    } catch (error) {
      this.rethrowUniqueEmail(error);
    }
  }

  private async assertEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }
  }

  private async requireRole(name: string) {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });
    if (!role) {
      throw new BadRequestException('Role không tồn tại');
    }
    return role;
  }

  private rethrowUniqueEmail(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Email đã được sử dụng');
    }
    throw error;
  }
}
