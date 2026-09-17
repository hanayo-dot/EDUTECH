import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDocumentDto {
  @ApiProperty({ example: 'TRANSCRIPT', enum: ['TRANSCRIPT', 'CERTIFICATE', 'PASSPORT_PHOTO', 'ID_CARD'] })
  @IsString()
  @IsIn(['TRANSCRIPT', 'CERTIFICATE', 'PASSPORT_PHOTO', 'ID_CARD'])
  docType!: string;

  @ApiProperty({ example: 'High School Diploma & Official Transcript' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'https://storage.chuoms.edu/documents/transcripts/app-trans-01.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiPropertyOptional({ example: 2048576 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class CreateApplicationDto {
  @ApiProperty({ example: 'David' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Kiprono' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: 'Chepkwony' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'david.kiprono@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '2004-05-14' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'Kenyan' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: '38291044' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ example: 'P.O. Box 40100, Nairobi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Mary Chepkwony' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+254722998877' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiProperty({ example: '312717bb-cb25-4786-a8df-a95e3a06d07c', description: 'Selected Program UUID' })
  @IsString()
  @IsNotEmpty()
  programId!: string;

  @ApiPropertyOptional({ example: '9b702c9b-7680-4c7f-87d1-d1b19de64303', description: 'Selected Campus UUID' })
  @IsOptional()
  @IsString()
  campusId?: string;

  @ApiProperty({ example: 'FALL 2026', description: 'Intake Term' })
  @IsString()
  @IsNotEmpty()
  intakeTerm!: string;

  @ApiPropertyOptional({ example: 'REGULAR', enum: ['REGULAR', 'EVENING', 'WEEKEND', 'DISTANCE'] })
  @IsOptional()
  @IsString()
  @IsIn(['REGULAR', 'EVENING', 'WEEKEND', 'DISTANCE'])
  studyMode?: string;

  @ApiPropertyOptional({ type: [CreateApplicationDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApplicationDocumentDto)
  documents?: CreateApplicationDocumentDto[];
}

export class ScoreApplicationDto {
  @ApiProperty({ example: 88.5, description: 'Evaluation score out of 100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiPropertyOptional({ example: 'Candidate meets primary entry requirements for Computer Science.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'SHORTLISTED', enum: ['SHORTLISTED', 'UNDER_REVIEW', 'REJECTED'] })
  @IsOptional()
  @IsString()
  @IsIn(['SHORTLISTED', 'UNDER_REVIEW', 'REJECTED'])
  status?: string;
}

export class AdmissionsDecisionDto {
  @ApiProperty({ example: 'OFFERED', enum: ['OFFERED', 'REJECTED'] })
  @IsString()
  @IsIn(['OFFERED', 'REJECTED'])
  decision!: 'OFFERED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Accepted into Bachelor of Science in Computer Science for Fall 2026 intake.' })
  @IsOptional()
  @IsString()
  decisionReason?: string;

  @ApiPropertyOptional({ example: 'Offer subject to verification of official physical degree certificates.' })
  @IsOptional()
  @IsString()
  conditions?: string;
}

export class AcceptOfferDto {
  @ApiProperty({ example: true, description: 'True to accept admission offer, False to decline' })
  @IsBoolean()
  accepted!: boolean;

  @ApiPropertyOptional({ example: 'Applicant formally accepts the offer for Fall 2026.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MatriculateApplicantDto {
  @ApiPropertyOptional({ example: '9b702c9b-7680-4c7f-87d1-d1b19de64303', description: 'Assigned Campus UUID' })
  @IsOptional()
  @IsString()
  campusId?: string;

  @ApiPropertyOptional({ example: 2026, description: 'Cohort year' })
  @IsOptional()
  @IsNumber()
  cohortYear?: number;

  @ApiPropertyOptional({ example: 100, description: 'Entry academic level' })
  @IsOptional()
  @IsNumber()
  currentLevel?: number;

  @ApiPropertyOptional({ example: 'REGULAR', enum: ['REGULAR', 'EVENING', 'WEEKEND', 'DISTANCE'] })
  @IsOptional()
  @IsString()
  @IsIn(['REGULAR', 'EVENING', 'WEEKEND', 'DISTANCE'])
  studyMode?: string;

  @ApiPropertyOptional({ example: 'Approved for matriculation after document verification and admission fee settlement.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AttachDocumentDto extends CreateApplicationDocumentDto {}

export class VerifyDocumentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isVerified!: boolean;

  @ApiPropertyOptional({ example: 'Verified against KNEC national examination portal database.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
