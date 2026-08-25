import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const COMPANY_ASSIGNABLE_ROLES = ['PURCHASER', 'ACCOUNTANT'] as const;

export class RegisterCompanyUserDto {
  @ApiProperty({ example: 'staff@abc.com', description: 'Email đăng nhập' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password!: string;

  @ApiProperty({ example: 'Trần Thị B', description: 'Họ tên nhân viên' })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName!: string;

  @ApiProperty({
    example: 'ACCOUNTANT',
    enum: COMPANY_ASSIGNABLE_ROLES,
    description:
      'Role của nhân viên thuộc company: PURCHASER hoặc ACCOUNTANT. Không gán SUPER_ADMIN/ADMIN.',
  })
  @IsString({ message: 'Role phải là chuỗi' })
  @IsNotEmpty({ message: 'Role là bắt buộc' })
  @IsIn(COMPANY_ASSIGNABLE_ROLES, {
    message: 'Role không hợp lệ cho tài khoản doanh nghiệp',
  })
  role!: (typeof COMPANY_ASSIGNABLE_ROLES)[number];
}
