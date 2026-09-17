import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { TimetablingService } from './timetabling.service';
import { DatabaseService } from '../database/database.service';
import {
  CreateRoomDto,
  UpdateRoomDto,
  CreateTimetableSlotDto,
  UpdateTimetableSlotDto,
  TimetableFilterDto,
} from './dto/timetable.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, SystemRole } from '@chuoms/common';

@ApiTags('Timetabling & Resource Scheduling')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetablingController {
  constructor(
    private readonly timetablingService: TimetablingService,
    private readonly db: DatabaseService,
  ) {}

  // =========================================================================
  // ROOM MANAGEMENT ENDPOINTS
  // =========================================================================

  @Get('rooms')
  @ApiOperation({ summary: 'List physical instructional rooms and capacities' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'roomType', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listRooms(
    @Query('campusId') campusId?: string,
    @Query('roomType') roomType?: string,
    @Query('search') search?: string,
  ) {
    return this.timetablingService.getRooms({ campusId, roomType, search });
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get room specifications and scheduled sessions' })
  async getRoom(@Param('id') id: string) {
    return this.timetablingService.getRoomById(id);
  }

  @Post('rooms')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
  )
  @ApiOperation({ summary: 'Register a new physical instructional room or hall' })
  async createRoom(
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.timetablingService.createRoom(
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Patch('rooms/:id')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
  )
  @ApiOperation({ summary: 'Update room capacity or operational status' })
  async updateRoom(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.timetablingService.updateRoom(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  // =========================================================================
  // TIMETABLE SLOT SCHEDULING ENDPOINTS (WITH CLASH DETECTION)
  // =========================================================================

  @Post('slots')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Schedule a new timetable slot with multi-dimensional clash detection' })
  async createSlot(
    @Body() dto: CreateTimetableSlotDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.timetablingService.createTimetableSlot(
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Patch('slots/:id')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Reschedule an existing timetable slot with clash validation' })
  async updateSlot(
    @Param('id') id: string,
    @Body() dto: UpdateTimetableSlotDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.timetablingService.updateTimetableSlot(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Delete('slots/:id')
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.ACADEMIC_ADMIN,
    SystemRole.REGISTRAR,
  )
  @ApiOperation({ summary: 'Delete and cancel a scheduled timetable slot' })
  async deleteSlot(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.timetablingService.deleteTimetableSlot(
      id,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  // =========================================================================
  // MULTI-FORMAT TIMETABLE QUERY VIEWS
  // =========================================================================

  @Get('master')
  @ApiOperation({ summary: 'Campus master timetable matrix filtered by department, campus, or room' })
  async getMasterTimetable(@Query() filter: TimetableFilterDto) {
    return this.timetablingService.getMasterTimetable(filter);
  }

  @Get('my-schedule')
  @ApiOperation({ summary: 'Shortcut to retrieve current authenticated user personalized weekly schedule' })
  @ApiQuery({ name: 'semesterId', required: false })
  async getMySchedule(
    @CurrentUser() user: JwtPayload,
    @Query('semesterId') semesterId?: string,
  ) {
    // Check if user has student profile
    const student = await this.db.student.findUnique({
      where: { userId: user.sub },
    });
    if (student) {
      return this.timetablingService.getStudentTimetable(student.id, semesterId);
    }

    // Check if user has staff/lecturer profile
    const staff = await this.db.staff.findUnique({
      where: { userId: user.sub },
    });
    if (staff) {
      return this.timetablingService.getLecturerTimetable(staff.id, semesterId);
    }

    throw new BadRequestException('Current user account is not mapped to an active student or teaching staff profile.');
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get personalized weekly timetable for a student' })
  @ApiQuery({ name: 'semesterId', required: false })
  async getStudentTimetable(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.timetablingService.getStudentTimetable(studentId, semesterId);
  }

  @Get('lecturer/:staffId')
  @ApiOperation({ summary: 'Get weekly teaching timetable for a lecturer' })
  @ApiQuery({ name: 'semesterId', required: false })
  async getLecturerTimetable(
    @Param('staffId') staffId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.timetablingService.getLecturerTimetable(staffId, semesterId);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get room utilization schedule by day of week' })
  @ApiQuery({ name: 'semesterId', required: false })
  async getRoomTimetable(
    @Param('roomId') roomId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.timetablingService.getRoomTimetable(roomId, semesterId);
  }
}
