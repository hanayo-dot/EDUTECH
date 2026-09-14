import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit time-based one-time password (TOTP)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'TOTP token must be exactly 6 digits' })
  token!: string;
}
