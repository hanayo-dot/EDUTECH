import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@chuoms.edu',
    description: 'Email, Username, Admission Number, or Staff Number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Login identifier is required' })
  identifier!: string;

  @ApiProperty({
    example: 'Password@2026!',
    description: 'Account password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiPropertyOptional({
    example: '123456',
    required: false,
    description: '6-digit TOTP code if MFA is enabled on the account',
  })
  @IsOptional()
  @IsString()
  totpCode?: string;
}
