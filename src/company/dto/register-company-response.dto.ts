import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisteredCompanyDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Công ty TNHH ABC' })
  name!: string;

  @ApiPropertyOptional({ example: '0901234567', nullable: true })
  phone!: string | null;

  @ApiProperty({
    example: '0',
    description: 'Hạn mức công nợ (string vì BigInt)',
  })
  creditLimit!: string;

  @ApiProperty({ example: '0' })
  remainingCredit!: string;

  @ApiProperty({ example: '0' })
  walletBalance!: string;

  @ApiProperty({ example: '2026-08-25T05:11:15.576Z' })
  createdAt!: Date;
}

export class RegisteredCompanyUserDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'owner@abc.com' })
  email!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  fullName!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'suspended'] })
  status!: string;

  @ApiProperty({ example: 1 })
  companyId!: number;

  @ApiProperty({ example: 'ACCOUNTANT', enum: ['PURCHASER', 'ACCOUNTANT'] })
  role!: string;
}

export class RegisterCompanyResultDto {
  @ApiProperty({ type: RegisteredCompanyDto })
  company!: RegisteredCompanyDto;

  @ApiProperty({ type: RegisteredCompanyUserDto })
  user!: RegisteredCompanyUserDto;
}

export class RegisterCompanyResponseDto {
  @ApiProperty({ example: 'success' })
  status!: 'success';

  @ApiProperty({ type: RegisterCompanyResultDto })
  data!: RegisterCompanyResultDto;
}

export class RegisterCompanyUserResponseDto {
  @ApiProperty({ example: 'success' })
  status!: 'success';

  @ApiProperty({ type: RegisteredCompanyUserDto })
  data!: RegisteredCompanyUserDto;
}
