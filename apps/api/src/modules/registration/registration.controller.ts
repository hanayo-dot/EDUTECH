import {
  Controller,
  Get,
  Post,
  Patch,
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
import { RegistrationService } from './registration.service';
import { DatabaseService } from '../database/database.service';
import {
  RegisterCoursesDto,
  DropCourseDto,
  CreateHoldDto,
  ReleaseHoldDto,
  CreateClassSectionDto,
} from './dto/registration.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, SystemRole } from '@chuoms/common';

@ApiTags('Course Registration & Enrollment')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly db: DatabaseService,
  ) {}

  @Get('sections')
  @ApiOperation({ summary: 'List available course sections with real-time seat availability' })
  @ApiQuery({ name: 'semesterId', required: true })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listSections(
    @Query('semesterId') semesterId: string,
    @Query('campusId') campusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.registrationService.getAvailableSections({
      semesterId,
      campusId,
      departmentId,
      search,
    });
  }

  @Get('sections/:id')
  @ApiOperation({ summary: 'Get class section details, timetable, and prerequisites' })
  async getSectionById(@Param('id') id: string) {
    return this.registrationService.getSectionById(id);
  }

  @Post('sections')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.INSTITUTION_ADMIN, SystemRole.ACADEMIC_ADMIN, SystemRole.REGISTRAR)
  @ApiOperation({ summary: 'Create a new course class section' })
  async createSection(
    @Body() dto: CreateClassSectionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.registrationService.createClassSection(
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Get('window/:semesterId')
  @ApiOperation({ summary: 'Check registration window open/closed status for a semester' })
  async getWindowStatus(@Param('semesterId') semesterId: string) {
    return this.registrationService.getRegistrationWindowStatus(semesterId);
  }

  @Get('my-enrollments')
  @ApiOperation({ summary: 'Get active enrollments for the currently authenticated student' })
  @ApiQuery({ name: 'semesterId', required: true })
  async getMyEnrollments(
    @Query('semesterId') semesterId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const student = await this.db.student.findUnique({
      where: { userId: user.sub },
    });

    if (!student) {
      throw new BadRequestException('No student profile associated with the current user account.');
    }

    return this.registrationService.getStudentRegistrations(student.id, semesterId);
  }

  @Get('student/:studentId')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.LECTURER,
    SystemRole.DEAN,
  )
  @ApiOperation({ summary: 'Get course registrations for a specific student' })
  @ApiQuery({ name: 'semesterId', required: true })
  async getStudentEnrollments(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId: string,
  ) {
    return this.registrationService.getStudentRegistrations(studentId, semesterId);
  }

  @Post('enroll')
  @ApiOperation({ summary: 'High-concurrency atomic course registration with prerequisite and hold checks' })
  async registerCourses(
    @Body() dto: RegisterCoursesDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    let targetStudentId = dto.studentId;
    if (!targetStudentId) {
      const student = await this.db.student.findUnique({
        where: { userId: user.sub },
      });
      if (!student) {
        throw new BadRequestException('Student ID must be provided when registering as an administrator.');
      }
      targetStudentId = student.id;
    }

    return this.registrationService.registerCourses(
      targetStudentId,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Post('drop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Drop an enrolled course and restore class capacity' })
  async dropCourse(
    @Body() dto: DropCourseDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    let targetStudentId = dto.studentId;
    if (!targetStudentId) {
      const student = await this.db.student.findUnique({
        where: { userId: user.sub },
      });
      if (!student) {
        throw new BadRequestException('Student ID must be provided when dropping as an administrator.');
      }
      targetStudentId = student.id;
    }

    return this.registrationService.dropCourse(
      targetStudentId,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Get('holds/:studentId')
  @ApiOperation({ summary: 'Get active and historical holds for a student' })
  async getHolds(@Param('studentId') studentId: string) {
    return this.registrationService.getStudentHolds(studentId);
  }

  @Post('holds')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.FINANCE_ADMIN,
    SystemRole.FINANCE_OFFICER,
    SystemRole.REGISTRAR,
  )
  @ApiOperation({ summary: 'Place a financial or academic hold on a student' })
  async placeHold(
    @Body() dto: CreateHoldDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.registrationService.placeHold(
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Patch('holds/:holdId/release')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.FINANCE_ADMIN,
    SystemRole.FINANCE_OFFICER,
    SystemRole.REGISTRAR,
  )
  @ApiOperation({ summary: 'Release an active financial or academic hold' })
  async releaseHold(
    @Param('holdId') holdId: string,
    @Body() dto: ReleaseHoldDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.registrationService.releaseHold(
      holdId,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }
}
