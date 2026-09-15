import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2026/2027', description: 'Academic year name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-09-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2027-06-30', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}

export class UpdateAcademicYearDto {
  @ApiPropertyOptional({ example: '2026/2027' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}

export class CreateSemesterDto {
  @ApiProperty({ example: 'academic-year-uuid-here' })
  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @ApiProperty({ example: 'Semester 1', description: 'Term name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-SEM1', description: 'Unique semester code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: '2026-09-01', description: 'Term start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2027-01-15', description: 'Term end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: '2026-08-15T00:00:00Z', description: 'Course registration start timestamp' })
  @IsDateString()
  registrationStart!: string;

  @ApiProperty({ example: '2026-09-15T23:59:59Z', description: 'Course registration end timestamp' })
  @IsDateString()
  registrationEnd!: string;
}

export class UpdateSemesterDto {
  @ApiPropertyOptional({ example: 'Semester 1' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-08-15T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  registrationStart?: string;

  @ApiPropertyOptional({ example: '2026-09-15T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  registrationEnd?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}
