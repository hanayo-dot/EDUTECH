import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsDateString,
  ArrayMinSize,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentType, GradeAppealStatus } from '@chuoms/common';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Continuous Assessment Test 1 (CAT 1)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AssessmentType, example: AssessmentType.CAT })
  @IsEnum(AssessmentType)
  assessmentType: AssessmentType;

  @ApiProperty({ example: 30.0, description: 'Maximum raw marks for this assessment' })
  @IsNumber()
  @Min(0.01)
  @Max(1000)
  maxMarks: number;

  @ApiProperty({ example: 30.0, description: 'Contribution weight percentage towards 100% final grade' })
  @IsNumber()
  @Min(0.01)
  @Max(100)
  weightPercentage: number;

  @ApiPropertyOptional({ example: '2026-10-15T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateAssessmentDto {
  @ApiPropertyOptional({ example: 'CAT 1 Updated' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: AssessmentType })
  @IsOptional()
  @IsEnum(AssessmentType)
  assessmentType?: AssessmentType;

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1000)
  maxMarks?: number;

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  weightPercentage?: number;

  @ApiPropertyOptional({ example: '2026-10-16T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class StudentAssessmentMarkDto {
  @ApiProperty({ example: 'b6f254b0-13f5-48b8-b80c-98284bb86300', description: 'Student UUID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 28.5, description: 'Marks obtained by student (0 to maxMarks)' })
  @IsNumber()
  @Min(0)
  marksObtained: number;

  @ApiPropertyOptional({ example: 'Well structured and rigorous solution.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class BatchAssessmentSubmissionDto {
  @ApiProperty({ type: [StudentAssessmentMarkDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAssessmentMarkDto)
  submissions: StudentAssessmentMarkDto[];
}

export class StudentExamMarkDto {
  @ApiProperty({ example: 'b6f254b0-13f5-48b8-b80c-98284bb86300', description: 'Student UUID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 65.0, description: 'Final examination raw or weighted marks' })
  @IsNumber()
  @Min(0)
  examMarks: number;
}

export class BatchExamMarksDto {
  @ApiProperty({ type: [StudentExamMarkDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentExamMarkDto)
  entries: StudentExamMarkDto[];
}

export enum ModerationAction {
  APPROVE_MODERATION = 'APPROVE_MODERATION',
  REQUEST_REVISION = 'REQUEST_REVISION',
}

export class ModerateSectionGradesDto {
  @ApiProperty({ enum: ModerationAction, example: ModerationAction.APPROVE_MODERATION })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiPropertyOptional({ example: 'Marks verified and conforms to department distribution standards.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AmendGradeDto {
  @ApiPropertyOptional({ example: 28.0, description: 'Revised Continuous Assessment marks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  continuousAssessmentMarks?: number;

  @ApiPropertyOptional({ example: 62.0, description: 'Revised Exam marks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  examMarks?: number;

  @ApiProperty({ example: 'Senate approved grade re-evaluation following recalculation of Question 4 marks.', minLength: 10 })
  @IsString()
  @MinLength(10)
  reason: string;
}

export class GradeAppealDto {
  @ApiProperty({ example: 'I request re-marking for final exam Section B, Question 3.', minLength: 10 })
  @IsString()
  @MinLength(10)
  reason: string;
}

export class ReviewAppealDto {
  @ApiProperty({ enum: [GradeAppealStatus.APPROVED, GradeAppealStatus.REJECTED] })
  @IsEnum(GradeAppealStatus)
  status: GradeAppealStatus;

  @ApiProperty({ example: 'Exam script re-marked by external examiner. Score adjusted by +4 marks.' })
  @IsString()
  @MinLength(5)
  resolution: string;

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  newContinuousAssessmentMarks?: number;

  @ApiPropertyOptional({ example: 68.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  newExamMarks?: number;
}

export class ProgressionCalculationDto {
  @ApiPropertyOptional({ example: 'b6f254b0-13f5-48b8-b80c-98284bb86300', description: 'Optional studentId to limit calculation' })
  @IsOptional()
  @IsString()
  studentId?: string;
}
