import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampusDto {
  @ApiProperty({ example: 'MAIN', description: 'Unique campus code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Metropolis Central Campus' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '100 University Boulevard' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'Metropolis' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiPropertyOptional({ example: 'UTC', default: 'UTC' })
  @IsString()
  @IsOptional()
  timezone?: string;
}

export class UpdateCampusDto {
  @ApiPropertyOptional({ example: 'Metropolis Central Campus' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '100 University Boulevard' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Metropolis' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateFacultyDto {
  @ApiProperty({ example: 'campus-uuid-here' })
  @IsString()
  @IsNotEmpty()
  campusId!: string;

  @ApiProperty({ example: 'FCI', description: 'Faculty code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Faculty of Computing & Informatics' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Staff ID of the Dean' })
  @IsString()
  @IsOptional()
  deanId?: string;
}

export class UpdateFacultyDto {
  @ApiPropertyOptional({ example: 'Faculty of Computing & Informatics' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Staff ID of the Dean' })
  @IsString()
  @IsOptional()
  deanId?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateDepartmentDto {
  @ApiProperty({ example: 'faculty-uuid-here' })
  @IsString()
  @IsNotEmpty()
  facultyId!: string;

  @ApiProperty({ example: 'CS', description: 'Department code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Department of Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Staff ID of Head of Department' })
  @IsString()
  @IsOptional()
  hodId?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Department of Computer Science & Software Engineering' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Staff ID of Head of Department' })
  @IsString()
  @IsOptional()
  hodId?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateProgramDto {
  @ApiProperty({ example: 'department-uuid-here' })
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @ApiProperty({ example: 'BSC-CS', description: 'Program code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Bachelor of Science in Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'BACHELOR', description: 'Degree level: BACHELOR, MASTER, DOCTORATE, DIPLOMA, CERTIFICATE' })
  @IsString()
  @IsNotEmpty()
  degreeLevel!: string;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationYears?: number;

  @ApiPropertyOptional({ example: 120, default: 120 })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalCreditsRequired?: number;
}

export class UpdateProgramDto {
  @ApiPropertyOptional({ example: 'Bachelor of Science in Computer Science' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'BACHELOR' })
  @IsString()
  @IsOptional()
  degreeLevel?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationYears?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalCreditsRequired?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
