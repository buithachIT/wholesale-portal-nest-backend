import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'owner@abc.com' })
  email!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  companyId!: number | null;

  @ApiProperty({ example: ['PURCHASER'], type: [String] })
  roles!: string[];

  @ApiProperty({ example: ['USER_CREATE', 'ORDER_CREATE'], type: [String] })
  permissions!: string[];
}

export class LoginResultDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token. Refresh token nằm trong cookie httpOnly.',
  })
  accessToken!: string;

  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'success' })
  status!: 'success';

  @ApiProperty({ type: LoginResultDto })
  data!: LoginResultDto;
}

export class RefreshResultDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'success' })
  status!: 'success';

  @ApiProperty({ type: RefreshResultDto })
  data!: RefreshResultDto;
}
