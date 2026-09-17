import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCoursesDto {
  @ApiPropertyOptional({ example: 'student-uuid-here', description: 'Student UUID (optional if logged in as student)' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: 'e688a6b3-ef54-4758-be45-eac159a6209f', description: 'Active Semester UUID' })
  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @ApiProperty({
    example: ['e71e680c-417e-498f-8a6e-caa185679d3e'],
    description: 'Array of ClassSection UUIDs to enroll in',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  classSectionIds!: string[];
}

export class DropCourseDto {
  @ApiPropertyOptional({ example: 'student-uuid-here' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: 'e71e680c-417e-498f-8a6e-caa185679d3e', description: 'ClassSection UUID to drop' })
  @IsString()
  @IsNotEmpty()
  classSectionId!: string;

  @ApiPropertyOptional({ example: 'Schedule conflict with elective' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateHoldDto {
  @ApiProperty({ example: 'student-uuid-here' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: 'Outstanding tuition balance of $1,500' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ example: 1500.0, default: 0 })
  @IsOptional()
  @IsNumber()
  thresholdAmount?: number;
}

export class ReleaseHoldDto {
  @ApiPropertyOptional({ example: 'Payment receipt #REC-2026-0042 verified' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateClassSectionDto {
  @ApiProperty({ example: '3384f533-f070-4c16-af81-66523ff1978f' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ example: 'e688a6b3-ef54-4758-be45-eac159a6209f' })
  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @ApiProperty({ example: '9b702c9b-7680-4c7f-87d1-d1b19de64303' })
  @IsString()
  @IsNotEmpty()
  campusId!: string;

  @ApiProperty({ example: 'Section B - Afternoon' })
  @IsString()
  @IsNotEmpty()
  sectionName!: string;

  @ApiProperty({ example: 50, default: 50 })
  @IsNumber()
  @Min(1)
  @Max(500)
  capacity!: number;

  @ApiPropertyOptional({ example: 'staff-uuid-here' })
  @IsOptional()
  @IsString()
  primaryLecturerId?: string;
}
