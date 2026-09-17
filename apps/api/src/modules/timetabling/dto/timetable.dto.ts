import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ description: 'Campus ID where the room is located' })
  @IsUUID()
  @IsNotEmpty()
  campusId: string;

  @ApiProperty({ description: 'Building name or complex', example: 'Turing Hall' })
  @IsString()
  @IsNotEmpty()
  building: string;

  @ApiProperty({ description: 'Room or Hall number', example: '101' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ description: 'Room seating capacity', example: 60 })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity: number;

  @ApiPropertyOptional({
    description: 'Room facility type',
    enum: ['LECTURE_HALL', 'LAB', 'AUDITORIUM', 'SEMINAR_ROOM'],
    default: 'LECTURE_HALL',
  })
  @IsOptional()
  @IsIn(['LECTURE_HALL', 'LAB', 'AUDITORIUM', 'SEMINAR_ROOM'])
  roomType?: string;
}

export class UpdateRoomDto {
  @ApiPropertyOptional({ description: 'Room seating capacity', example: 70 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Room facility type',
    enum: ['LECTURE_HALL', 'LAB', 'AUDITORIUM', 'SEMINAR_ROOM'],
  })
  @IsOptional()
  @IsIn(['LECTURE_HALL', 'LAB', 'AUDITORIUM', 'SEMINAR_ROOM'])
  roomType?: string;

  @ApiPropertyOptional({ description: 'Room operational availability' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateTimetableSlotDto {
  @ApiProperty({ description: 'Class Section ID to schedule' })
  @IsUUID()
  @IsNotEmpty()
  classSectionId: string;

  @ApiProperty({ description: 'Assigned physical room ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'Day of the week (1 = Monday, 2 = Tuesday, ..., 7 = Sunday)',
    minimum: 1,
    maximum: 7,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Session start time in 24-hour HH:mm format',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be formatted as 24-hour time HH:mm (e.g. 09:00, 14:30)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Session end time in 24-hour HH:mm format',
    example: '11:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be formatted as 24-hour time HH:mm (e.g. 11:00, 16:30)',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Instructional session type',
    enum: ['LECTURE', 'TUTORIAL', 'LAB', 'EXAM'],
    default: 'LECTURE',
  })
  @IsOptional()
  @IsIn(['LECTURE', 'TUTORIAL', 'LAB', 'EXAM'])
  sessionType?: string;
}

export class UpdateTimetableSlotDto {
  @ApiPropertyOptional({ description: 'Assigned physical room ID' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Day of the week (1 = Monday, 2 = Tuesday, ..., 7 = Sunday)',
    minimum: 1,
    maximum: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Session start time in 24-hour HH:mm format',
    example: '09:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be formatted as 24-hour time HH:mm',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Session end time in 24-hour HH:mm format',
    example: '11:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be formatted as 24-hour time HH:mm',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Instructional session type',
    enum: ['LECTURE', 'TUTORIAL', 'LAB', 'EXAM'],
  })
  @IsOptional()
  @IsIn(['LECTURE', 'TUTORIAL', 'LAB', 'EXAM'])
  sessionType?: string;
}

export class TimetableFilterDto {
  @ApiPropertyOptional({ description: 'Semester ID to filter timetable' })
  @IsOptional()
  @IsUUID()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Campus ID to filter timetable' })
  @IsOptional()
  @IsUUID()
  campusId?: string;

  @ApiPropertyOptional({ description: 'Department ID to filter timetable' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Room ID to filter room schedule' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Staff ID to filter lecturer schedule' })
  @IsOptional()
  @IsUUID()
  lecturerId?: string;

  @ApiPropertyOptional({ description: 'Day of week (1-7)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;
}
