import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'department-uuid-here' })
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @ApiProperty({ example: 'CS201', description: 'Unique course code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Data Structures & Algorithms' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Fundamental algorithmic structures, complexity, trees, graphs' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  creditHours?: number;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  contactHours?: number;

  @ApiPropertyOptional({ example: 200, default: 100 })
  @IsInt()
  @Min(100)
  @Max(800)
  @IsOptional()
  level?: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Data Structures & Algorithms' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  creditHours?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  contactHours?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsInt()
  @Min(100)
  @Max(800)
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AddPrerequisiteDto {
  @ApiProperty({ example: 'prerequisite-course-uuid-here', description: 'ID of the prerequisite course' })
  @IsString()
  @IsNotEmpty()
  prerequisiteCourseId!: string;

  @ApiPropertyOptional({ example: 'C', default: 'D', description: 'Minimum letter grade required' })
  @IsString()
  @IsOptional()
  minGradeRequired?: string;

  @ApiPropertyOptional({ example: 'PREREQUISITE', enum: ['PREREQUISITE', 'CO_REQUISITE'], default: 'PREREQUISITE' })
  @IsIn(['PREREQUISITE', 'CO_REQUISITE'])
  @IsOptional()
  type?: 'PREREQUISITE' | 'CO_REQUISITE';
}

export class CreateCurriculumVersionDto {
  @ApiProperty({ example: '2026 Revision', description: 'Version name or cohort label' })
  @IsString()
  @IsNotEmpty()
  versionName!: string;

  @ApiProperty({ example: 2026, description: 'Academic intake year' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  academicYear!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AddCurriculumCourseDto {
  @ApiProperty({ example: 'course-uuid-here' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Year of study (1-6)' })
  @IsInt()
  @Min(1)
  @Max(6)
  @IsOptional()
  yearOfStudy?: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Semester number in year (1-3)' })
  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  semesterNumber?: number;

  @ApiPropertyOptional({ example: true, default: true, description: 'Core course or Elective' })
  @IsBoolean()
  @IsOptional()
  isCore?: boolean;
}
