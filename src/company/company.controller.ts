import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators/current-user/current-user.decorator';
import { RequirePermissions } from '@/auth/decorators/require-permissions/require-permissions.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/guards/permissions/permissions.guard';
import type { AuthenticatedUser } from '@/auth/strategies/jwt.strategy';
import { CompanyService } from './company.service';
import {
  RegisterCompanyResponseDto,
  RegisterCompanyUserResponseDto,
} from './dto/register-company-response.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RegisterCompanyUserDto } from './dto/register-company-user.dto';

const companyIdPipe = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException('companyId không hợp lệ'),
});

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('COMPANY_CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cấp tài khoản doanh nghiệp',
    description:
      'Tạo company (credit/wallet = 0) và user đại diện với role PURCHASER. Chỉ nhân viên nội bộ có quyền COMPANY_CREATE.',
  })
  @ApiBody({ type: RegisterCompanyDto })
  @ApiCreatedResponse({ type: RegisterCompanyResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({
    description: 'Không có quyền thực hiện thao tác này',
  })
  @ApiConflictResponse({ description: 'Email đã được sử dụng' })
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterCompanyDto,
  ) {
    return this.companyService.register(dto, user);
  }

  @Post(':companyId/users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('USER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cấp tài khoản con cho doanh nghiệp',
    description:
      'Tạo user thuộc company. Chọn role PURCHASER hoặc ACCOUNTANT. Không gán SUPER_ADMIN/ADMIN. Doanh nghiệp chỉ được cấp user cho company của mình.',
  })
  @ApiParam({ name: 'companyId', type: Number, example: 1 })
  @ApiBody({ type: RegisterCompanyUserDto })
  @ApiCreatedResponse({ type: RegisterCompanyUserResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({
    description: 'Không có quyền thực hiện thao tác này',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy doanh nghiệp' })
  @ApiConflictResponse({ description: 'Email đã được sử dụng' })
  createUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', companyIdPipe) companyId: number,
    @Body() dto: RegisterCompanyUserDto,
  ) {
    return this.companyService.createUser(companyId, dto, user);
  }
}
