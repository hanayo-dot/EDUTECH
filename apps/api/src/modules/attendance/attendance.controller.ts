import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { DatabaseService } from '../database/database.service';
import {
  CreateAttendanceSessionDto,
  BatchMarkAttendanceDto,
  StudentCheckInDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, SystemRole } from '@chuoms/common';

@ApiTags('Attendance Tracking & Exam Eligibility')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly db: DatabaseService,
  ) {}

  // =========================================================================
  // 1. SESSION MANAGEMENT ENDPOINTS
  // =========================================================================

  @Post('sessions')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Initiate an attendance session with dynamic, time-decaying QR code' })
  async createSession(
    @Body() dto: CreateAttendanceSessionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.attendanceService.createSession(
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Post('sessions/:id/refresh-qr')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Refresh / rotate dynamic QR token for active session projection' })
  async refreshQr(
    @Param('id') id: string,
    @Query('expiryMinutes') expiryMinutes: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.attendanceService.refreshQrToken(
      id,
      expiryMinutes || 15,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details with enrolled student roster & live statistics' })
  async getSessionDetails(@Param('id') id: string) {
    return this.attendanceService.getSessionDetails(id);
  }

  @Get('section/:classSectionId/sessions')
  @ApiOperation({ summary: 'List all instructional attendance sessions for a class section' })
  async getSectionSessions(@Param('classSectionId') classSectionId: string) {
    return this.attendanceService.getSectionSessions(classSectionId);
  }

  // =========================================================================
  // 2. ATTENDANCE RECORDING ENDPOINTS
  // =========================================================================

  @Post('sessions/:id/mark-batch')
  @HttpCode(HttpStatus.OK)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Record manual batch attendance roster (Present, Absent, Late, Excused)' })
  async batchMark(
    @Param('id') id: string,
    @Body() dto: BatchMarkAttendanceDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.attendanceService.batchMarkAttendance(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student self-service QR code attendance check-in' })
  async studentCheckIn(
    @Body() dto: StudentCheckInDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.attendanceService.studentCheckIn(
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  // =========================================================================
  // 3. ANALYTICS & EXAM ELIGIBILITY (75% RULE)
  // =========================================================================

  @Get('my-summary')
  @ApiOperation({ summary: 'Current student attendance percentages and exam eligibility status' })
  @ApiQuery({ name: 'semesterId', required: false })
  async getMyAttendance(
    @CurrentUser() user: JwtPayload,
    @Query('semesterId') semesterId?: string,
  ) {
    const student = await this.db.student.findUnique({
      where: { userId: user.sub },
    });

    if (!student) {
      throw new BadRequestException('Current user account is not associated with an active student profile.');
    }

    return this.attendanceService.getStudentAttendanceSummary(student.id, semesterId);
  }

  @Get('student/:studentId/summary')
  @ApiOperation({ summary: 'Get course attendance summary and exam threshold check for a student' })
  @ApiQuery({ name: 'semesterId', required: false })
  async getStudentSummary(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(studentId, semesterId);
  }

  @Get('section/:classSectionId/report')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.DEAN,
    SystemRole.HEAD_OF_DEPARTMENT,
    SystemRole.LECTURER,
  )
  @ApiOperation({ summary: 'Section attendance audit report with list of at-risk students (< 75%)' })
  async getSectionReport(@Param('classSectionId') classSectionId: string) {
    return this.attendanceService.getSectionAttendanceReport(classSectionId);
  }
}
