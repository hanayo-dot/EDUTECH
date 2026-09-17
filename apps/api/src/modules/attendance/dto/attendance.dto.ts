import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  Matches,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceSessionDto {
  @ApiProperty({ description: 'Class Section ID for this attendance session' })
  @IsUUID()
  @IsNotEmpty()
  classSectionId: string;

  @ApiProperty({
    description: 'Date of instructional session (YYYY-MM-DD)',
    example: '2026-09-20',
  })
  @IsDateString()
  @IsNotEmpty()
  sessionDate: string;

  @ApiProperty({
    description: 'Session start time in 24-hour format HH:mm',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be formatted as 24-hour time HH:mm (e.g. 09:00, 14:30)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Session end time in 24-hour format HH:mm',
    example: '11:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be formatted as 24-hour time HH:mm (e.g. 11:00, 16:30)',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes for dynamic QR code validity',
    default: 15,
    minimum: 1,
    maximum: 240,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  qrExpiryMinutes?: number;
}

export class StudentAttendanceStatusDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Attendance disposition status',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    example: 'PRESENT',
  })
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export class BatchMarkAttendanceDto {
  @ApiProperty({
    description: 'List of student attendance status records',
    type: [StudentAttendanceStatusDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceStatusDto)
  records: StudentAttendanceStatusDto[];
}

export class StudentCheckInDto {
  @ApiProperty({
    description: 'Dynamic QR token displayed by lecturer',
    example: 'd8c47ef0-5fa1-4235-8669-e7be3d312984',
  })
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @ApiPropertyOptional({ description: 'Optional Attendance Session ID' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class AttendanceReportFilterDto {
  @ApiPropertyOptional({ description: 'Filter by Semester ID' })
  @IsOptional()
  @IsUUID()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
