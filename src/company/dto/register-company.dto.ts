import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Công ty TNHH ABC', description: 'Tên doanh nghiệp' })
  @IsString({ message: 'Tên doanh nghiệp phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên doanh nghiệp là bắt buộc' })
  @MaxLength(150, { message: 'Tên doanh nghiệp tối đa 150 ký tự' })
  name!: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @ApiProperty({ example: 'owner@abc.com', description: 'Email đăng nhập' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password!: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ tên người đại diện',
  })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName!: string;
}
