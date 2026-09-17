import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { GradingService } from './grading.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  BatchAssessmentSubmissionDto,
  BatchExamMarksDto,
  ModerateSectionGradesDto,
  AmendGradeDto,
  GradeAppealDto,
  ReviewAppealDto,
  ProgressionCalculationDto,
} from './dto/grading.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, SystemRole, GradeWorkflowStatus } from '@chuoms/common';

@ApiTags('Assessments, Gradebook & GPA Progression')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  // =========================================================================
  // 1. ASSESSMENT MANAGEMENT
  // =========================================================================

  @Post('sections/:sectionId/assessments')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Create an assessment for a class section (CAT, Lab, Quiz, Exam)' })
  async createAssessment(
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.createAssessment(sectionId, dto, user, ip, ua);
  }

  @Get('sections/:sectionId/assessments')
  @ApiOperation({ summary: 'List all assessments for a class section' })
  async getAssessmentsBySection(@Param('sectionId') sectionId: string) {
    return this.gradingService.getAssessmentsBySection(sectionId);
  }

  @Put('assessments/:assessmentId')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Update an assessment structure or weight' })
  async updateAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() dto: UpdateAssessmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.updateAssessment(assessmentId, dto, user, ip, ua);
  }

  @Delete('assessments/:assessmentId')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Delete an assessment' })
  async deleteAssessment(
    @Param('assessmentId') assessmentId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.deleteAssessment(assessmentId, user, ip, ua);
  }

  // =========================================================================
  // 2. ASSESSMENT MARKS ENTRY & GRADEBOOK ROSTER
  // =========================================================================

  @Post('assessments/:assessmentId/submissions/batch')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Batch input student assessment scores' })
  async batchSubmitAssessmentMarks(
    @Param('assessmentId') assessmentId: string,
    @Body() dto: BatchAssessmentSubmissionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.batchSubmitAssessmentMarks(assessmentId, dto, user, ip, ua);
  }

  @Post('sections/:sectionId/exam-marks/batch')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Batch input final examination scores' })
  async batchSubmitExamMarks(
    @Param('sectionId') sectionId: string,
    @Body() dto: BatchExamMarksDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.batchSubmitExamMarks(sectionId, dto, user, ip, ua);
  }

  @Get('sections/:sectionId/gradebook')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.EXAMINATION_OFFICER,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Get full gradebook grid for a course section' })
  async getSectionGradebook(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gradingService.getSectionGradebook(sectionId, user);
  }

  // =========================================================================
  // 3. WORKFLOW STATE MACHINE
  // =========================================================================

  @Post('sections/:sectionId/submit')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lecturer submits section grades for moderation (DRAFT -> SUBMITTED)' })
  async submitSectionGrades(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.submitSectionGrades(sectionId, user, ip, ua);
  }

  @Post('sections/:sectionId/moderate')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'HoD moderates grades or requests revision (SUBMITTED -> MODERATED / DRAFT)' })
  async moderateSectionGrades(
    @Param('sectionId') sectionId: string,
    @Body() dto: ModerateSectionGradesDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.moderateSectionGrades(sectionId, dto, user, ip, ua);
  }

  @Post('sections/:sectionId/approve')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faculty Dean approves moderated grades (MODERATED -> APPROVED)' })
  async approveSectionGrades(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.approveSectionGrades(sectionId, user, ip, ua);
  }

  @Post('sections/:sectionId/publish')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ACADEMIC_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar publishes grades to students and auto-triggers GPA calculation' })
  async publishSectionGrades(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.publishSectionGrades(sectionId, user, ip, ua);
  }

  // =========================================================================
  // 4. ELEVATED GRADE AMENDMENT & APPEALS
  // =========================================================================

  @Post('grades/:gradeId/amend')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ACADEMIC_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Elevated post-publication grade amendment with full audit logging' })
  async amendPublishedGrade(
    @Param('gradeId') gradeId: string,
    @Body() dto: AmendGradeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.amendPublishedGrade(gradeId, dto, user, ip, ua);
  }

  @Post('grades/:gradeId/appeal')
  @Roles(SystemRole.STUDENT)
  @ApiOperation({ summary: 'Student files a formal grade appeal' })
  async submitGradeAppeal(
    @Param('gradeId') gradeId: string,
    @Body() dto: GradeAppealDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.submitGradeAppeal(gradeId, dto, user, ip, ua);
  }

  @Post('grades/:gradeId/appeal/review')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve grade appeal (Approve adjustment or Reject)' })
  async reviewGradeAppeal(
    @Param('gradeId') gradeId: string,
    @Body() dto: ReviewAppealDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    return this.gradingService.reviewGradeAppeal(gradeId, dto, user, ip, ua);
  }

  // =========================================================================
  // 5. GPA, CGPA & ACADEMIC PROGRESSION
  // =========================================================================

  @Post('semesters/:semesterId/calculate-progression')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ACADEMIC_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate SGPA, CGPA and Academic Standing for semester' })
  async calculateProgression(
    @Param('semesterId') semesterId: string,
    @Body() dto: ProgressionCalculationDto,
  ) {
    return this.gradingService.calculateSemesterProgression(semesterId, dto?.studentId);
  }

  @Get('students/:studentId/transcript')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
    SystemRole.STUDENT,
  )
  @ApiQuery({ name: 'official', required: false, type: Boolean })
  @ApiOperation({ summary: 'Get full academic transcript and progression history' })
  async getStudentTranscript(
    @Param('studentId') studentId: string,
    @Query('official') official: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // If student, ensure requesting own transcript
    if (user.studentId && user.studentId !== studentId) {
      throw new ForbiddenException('You can only view your own academic transcript.');
    }
    return this.gradingService.getStudentTranscript(studentId, official === 'true');
  }

  @Get('my-grades')
  @Roles(SystemRole.STUDENT)
  @ApiOperation({ summary: 'Convenience endpoint for authenticated student to view official grades' })
  async getMyGrades(@CurrentUser() user: JwtPayload) {
    return this.gradingService.getMyGrades(user);
  }

  // =========================================================================
  // 6. PIPELINE QUEUES
  // =========================================================================

  @Get('pipeline/submitted')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.EXAMINATION_OFFICER,
  )
  @ApiOperation({ summary: 'Get course sections pending moderation' })
  async getSubmittedSections() {
    return this.gradingService.getSectionsByWorkflowStatus(GradeWorkflowStatus.SUBMITTED);
  }

  @Get('pipeline/moderated')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.DEAN,
  )
  @ApiOperation({ summary: 'Get course sections pending Dean approval' })
  async getModeratedSections() {
    return this.gradingService.getSectionsByWorkflowStatus(GradeWorkflowStatus.MODERATED);
  }

  @Get('pipeline/approved')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ACADEMIC_ADMIN,
  )
  @ApiOperation({ summary: 'Get course sections pending Registrar publication' })
  async getApprovedSections() {
    return this.gradingService.getSectionsByWorkflowStatus(GradeWorkflowStatus.APPROVED);
  }
}
