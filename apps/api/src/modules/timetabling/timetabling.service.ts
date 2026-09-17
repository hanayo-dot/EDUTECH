import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateRoomDto,
  UpdateRoomDto,
  CreateTimetableSlotDto,
  UpdateTimetableSlotDto,
  TimetableFilterDto,
} from './dto/timetable.dto';

@Injectable()
export class TimetablingService {
  private readonly logger = new Logger(TimetablingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper: Map day index (1-7) to human-readable day name
   */
  public formatDayOfWeek(day: number): string {
    const days: Record<number, string> = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday',
    };
    return days[day] || `Day ${day}`;
  }

  /**
   * Helper: Check if two time ranges overlap on the same day
   * Standard interval overlap condition: startA < endB && startB < endA
   */
  public doSlotsOverlap(
    slotA: { startTime: string; endTime: string },
    slotB: { startTime: string; endTime: string },
  ): boolean {
    return slotA.startTime < slotB.endTime && slotB.startTime < slotA.endTime;
  }

  /**
   * Validate time format and duration
   */
  private validateTimeInterval(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException({
        code: 'INVALID_TIME_RANGE',
        message: `startTime (${startTime}) must be strictly earlier than endTime (${endTime}).`,
      });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

    if (durationMinutes < 30) {
      throw new BadRequestException({
        code: 'SESSION_TOO_SHORT',
        message: `Session duration must be at least 30 minutes. Current duration: ${durationMinutes} minutes.`,
      });
    }
  }

  // =========================================================================
  // 1. ROOM RESOURCE MANAGEMENT
  // =========================================================================

  async createRoom(
    dto: CreateRoomDto,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const campus = await this.db.campus.findUnique({
      where: { id: dto.campusId },
    });

    if (!campus) {
      throw new NotFoundException(`Campus ${dto.campusId} not found.`);
    }

    const existing = await this.db.room.findUnique({
      where: {
        campusId_building_roomNumber: {
          campusId: dto.campusId,
          building: dto.building,
          roomNumber: dto.roomNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ROOM_ALREADY_EXISTS',
        message: `Room "${dto.building} - ${dto.roomNumber}" already exists on campus "${campus.name}".`,
      });
    }

    const room = await this.db.room.create({
      data: {
        campusId: dto.campusId,
        building: dto.building,
        roomNumber: dto.roomNumber,
        capacity: dto.capacity,
        roomType: dto.roomType || 'LECTURE_HALL',
        isActive: true,
      },
      include: { campus: true },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'ROOM_CREATED',
      resource: 'ROOM',
      resourceId: room.id,
      newValues: {
        building: room.building,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        campus: room.campus.code,
      },
      ipAddress,
      userAgent,
      reason: 'Physical instructional room registered',
    });

    return room;
  }

  async getRooms(params: { campusId?: string; roomType?: string; search?: string }) {
    const where: any = {};
    if (params.campusId) where.campusId = params.campusId;
    if (params.roomType) where.roomType = params.roomType;
    if (params.search) {
      where.OR = [
        { building: { contains: params.search, mode: 'insensitive' } },
        { roomNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.db.room.findMany({
      where,
      orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }],
      include: {
        campus: { select: { id: true, code: true, name: true } },
        _count: { select: { timetableSlots: true } },
      },
    });
  }

  async getRoomById(id: string) {
    const room = await this.db.room.findUnique({
      where: { id },
      include: {
        campus: true,
        timetableSlots: {
          include: {
            classSection: {
              include: {
                course: true,
                primaryLecturer: { include: { user: true } },
              },
            },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room ${id} not found.`);
    }

    return room;
  }

  async updateRoom(
    id: string,
    dto: UpdateRoomDto,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const room = await this.db.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room ${id} not found.`);
    }

    const updated = await this.db.room.update({
      where: { id },
      data: {
        capacity: dto.capacity !== undefined ? dto.capacity : room.capacity,
        roomType: dto.roomType || room.roomType,
        isActive: dto.isActive !== undefined ? dto.isActive : room.isActive,
      },
      include: { campus: true },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'ROOM_UPDATED',
      resource: 'ROOM',
      resourceId: id,
      newValues: dto,
      ipAddress,
      userAgent,
      reason: 'Room parameters modified',
    });

    return updated;
  }

  // =========================================================================
  // 2. TIMETABLE CONFLICT DETECTION ENGINE
  // =========================================================================

  /**
   * Comprehensive validation:
   * 1. Validates time intervals
   * 2. Checks room capacity vs class section capacity
   * 3. Detects room collisions
   * 4. Detects lecturer schedule overlaps
   * 5. Detects class section internal clashes
   */
  async validateSlotConflicts(data: {
    classSectionId: string;
    roomId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    excludeSlotId?: string;
  }) {
    this.validateTimeInterval(data.startTime, data.endTime);

    // 1. Fetch Room and Class Section
    const room = await this.db.room.findUnique({
      where: { id: data.roomId },
      include: { campus: true },
    });

    if (!room) {
      throw new NotFoundException(`Room ${data.roomId} not found.`);
    }

    if (!room.isActive) {
      throw new BadRequestException({
        code: 'ROOM_INACTIVE',
        message: `Room "${room.building} - ${room.roomNumber}" is currently marked inactive for scheduling.`,
      });
    }

    const section = await this.db.classSection.findUnique({
      where: { id: data.classSectionId },
      include: {
        course: true,
        primaryLecturer: { include: { user: true } },
      },
    });

    if (!section) {
      throw new NotFoundException(`ClassSection ${data.classSectionId} not found.`);
    }

    // 2. Capacity Validation: Room must accommodate section capacity
    if (room.capacity < section.capacity) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_ROOM_CAPACITY',
        message: `Selected room "${room.building} - ${room.roomNumber}" has capacity of ${room.capacity} seats, which is insufficient for section "${section.sectionName}" capacity of ${section.capacity} students.`,
      });
    }

    const dayName = this.formatDayOfWeek(data.dayOfWeek);

    // 3. Room Conflict Detection: No other slot can use this room at overlapping time
    const roomSlots = await this.db.timetableSlot.findMany({
      where: {
        roomId: data.roomId,
        dayOfWeek: data.dayOfWeek,
        id: data.excludeSlotId ? { not: data.excludeSlotId } : undefined,
      },
      include: {
        classSection: {
          include: { course: true },
        },
      },
    });

    for (const existing of roomSlots) {
      if (this.doSlotsOverlap(data, existing)) {
        throw new ConflictException({
          code: 'ROOM_CLASH',
          message: `Room clash: "${room.building} - ${room.roomNumber}" is already booked on ${dayName} from ${existing.startTime} to ${existing.endTime} by course ${existing.classSection.course.code} (${existing.classSection.sectionName}).`,
        });
      }
    }

    // 4. Lecturer Conflict Detection: Assigned lecturer cannot teach two sections simultaneously
    if (section.primaryLecturerId) {
      const lecturerSlots = await this.db.timetableSlot.findMany({
        where: {
          dayOfWeek: data.dayOfWeek,
          id: data.excludeSlotId ? { not: data.excludeSlotId } : undefined,
          classSection: {
            primaryLecturerId: section.primaryLecturerId,
            id: { not: data.classSectionId }, // across different sections
          },
        },
        include: {
          classSection: {
            include: { course: true },
          },
        },
      });

      for (const existing of lecturerSlots) {
        if (this.doSlotsOverlap(data, existing)) {
          const lecturerName = `${section.primaryLecturer?.user.firstName} ${section.primaryLecturer?.user.lastName}`;
          throw new ConflictException({
            code: 'LECTURER_CLASH',
            message: `Lecturer schedule conflict: ${lecturerName} is already teaching ${existing.classSection.course.code} (${existing.classSection.sectionName}) on ${dayName} from ${existing.startTime} to ${existing.endTime}.`,
          });
        }
      }
    }

    // 5. Section Internal Clash Detection: The same section cannot have overlapping sessions
    const sectionSlots = await this.db.timetableSlot.findMany({
      where: {
        classSectionId: data.classSectionId,
        dayOfWeek: data.dayOfWeek,
        id: data.excludeSlotId ? { not: data.excludeSlotId } : undefined,
      },
    });

    for (const existing of sectionSlots) {
      if (this.doSlotsOverlap(data, existing)) {
        throw new ConflictException({
          code: 'SECTION_CLASH',
          message: `Section clash: "${section.sectionName}" already has a session scheduled on ${dayName} from ${existing.startTime} to ${existing.endTime}.`,
        });
      }
    }

    return { room, section };
  }

  // =========================================================================
  // 3. TIMETABLE SLOT CRUD OPERATIONS
  // =========================================================================

  async createTimetableSlot(
    dto: CreateTimetableSlotDto,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const { room, section } = await this.validateSlotConflicts(dto);

    const slot = await this.db.timetableSlot.create({
      data: {
        classSectionId: dto.classSectionId,
        roomId: dto.roomId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        sessionType: dto.sessionType || 'LECTURE',
      },
      include: {
        room: { include: { campus: true } },
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'TIMETABLE_SLOT_CREATED',
      resource: 'TIMETABLE_SLOT',
      resourceId: slot.id,
      newValues: {
        courseCode: section.course.code,
        sectionName: section.sectionName,
        room: `${room.building} ${room.roomNumber}`,
        day: this.formatDayOfWeek(slot.dayOfWeek),
        time: `${slot.startTime}-${slot.endTime}`,
      },
      ipAddress,
      userAgent,
      reason: 'New timetable slot allocated',
    });

    return slot;
  }

  async updateTimetableSlot(
    id: string,
    dto: UpdateTimetableSlotDto,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const current = await this.db.timetableSlot.findUnique({
      where: { id },
      include: { classSection: true },
    });

    if (!current) {
      throw new NotFoundException(`TimetableSlot ${id} not found.`);
    }

    const merged = {
      classSectionId: current.classSectionId,
      roomId: dto.roomId || current.roomId,
      dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : current.dayOfWeek,
      startTime: dto.startTime || current.startTime,
      endTime: dto.endTime || current.endTime,
      excludeSlotId: id,
    };

    await this.validateSlotConflicts(merged);

    const updated = await this.db.timetableSlot.update({
      where: { id },
      data: {
        roomId: merged.roomId,
        dayOfWeek: merged.dayOfWeek,
        startTime: merged.startTime,
        endTime: merged.endTime,
        sessionType: dto.sessionType || current.sessionType,
      },
      include: {
        room: { include: { campus: true } },
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'TIMETABLE_SLOT_UPDATED',
      resource: 'TIMETABLE_SLOT',
      resourceId: id,
      newValues: dto,
      ipAddress,
      userAgent,
      reason: 'Timetable slot rescheduled',
    });

    return updated;
  }

  async deleteTimetableSlot(
    id: string,
    user: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const slot = await this.db.timetableSlot.findUnique({
      where: { id },
      include: {
        classSection: { include: { course: true } },
        room: true,
      },
    });

    if (!slot) {
      throw new NotFoundException(`TimetableSlot ${id} not found.`);
    }

    await this.db.timetableSlot.delete({ where: { id } });

    await this.auditService.log({
      userId: user.sub,
      userEmail: user.email,
      action: 'TIMETABLE_SLOT_DELETED',
      resource: 'TIMETABLE_SLOT',
      resourceId: id,
      newValues: {
        courseCode: slot.classSection.course.code,
        room: `${slot.room.building} ${slot.room.roomNumber}`,
        day: this.formatDayOfWeek(slot.dayOfWeek),
        time: `${slot.startTime}-${slot.endTime}`,
      },
      ipAddress,
      userAgent,
      reason: 'Timetable slot canceled and released',
    });

    return {
      success: true,
      message: `Timetable slot for ${slot.classSection.course.code} on ${this.formatDayOfWeek(slot.dayOfWeek)} (${slot.startTime}-${slot.endTime}) successfully deleted.`,
    };
  }

  // =========================================================================
  // 4. MULTI-FORMAT TIMETABLE QUERY VIEWS
  // =========================================================================

  /**
   * Helper to format raw slots into standardized 7-day calendar matrix
   */
  private buildWeeklyMatrix(slots: any[]) {
    const weekDays = [
      { dayOfWeek: 1, dayName: 'Monday', slots: [] as any[] },
      { dayOfWeek: 2, dayName: 'Tuesday', slots: [] as any[] },
      { dayOfWeek: 3, dayName: 'Wednesday', slots: [] as any[] },
      { dayOfWeek: 4, dayName: 'Thursday', slots: [] as any[] },
      { dayOfWeek: 5, dayName: 'Friday', slots: [] as any[] },
      { dayOfWeek: 6, dayName: 'Saturday', slots: [] as any[] },
      { dayOfWeek: 7, dayName: 'Sunday', slots: [] as any[] },
    ];

    const dayMap = new Map(weekDays.map((d) => [d.dayOfWeek, d]));

    for (const slot of slots) {
      const dayEntry = dayMap.get(slot.dayOfWeek);
      if (dayEntry) {
        dayEntry.slots.push({
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          dayName: this.formatDayOfWeek(slot.dayOfWeek),
          startTime: slot.startTime,
          endTime: slot.endTime,
          sessionType: slot.sessionType,
          course: {
            id: slot.classSection.course.id,
            code: slot.classSection.course.code,
            title: slot.classSection.course.title,
            creditHours: slot.classSection.course.creditHours,
          },
          section: {
            id: slot.classSection.id,
            name: slot.classSection.sectionName,
            enrolledCount: slot.classSection.enrolledCount,
            capacity: slot.classSection.capacity,
          },
          room: {
            id: slot.room.id,
            building: slot.room.building,
            roomNumber: slot.room.roomNumber,
            capacity: slot.room.capacity,
            roomType: slot.room.roomType,
          },
          lecturer: slot.classSection.primaryLecturer
            ? `${slot.classSection.primaryLecturer.user.firstName} ${slot.classSection.primaryLecturer.user.lastName}`
            : 'To Be Assigned',
        });
      }
    }

    // Sort each day by startTime
    for (const day of weekDays) {
      day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return weekDays;
  }

  /**
   * View 1: Student Personalized Timetable
   */
  async getStudentTimetable(studentId: string, semesterId?: string) {
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, admissionNumber: true } },
        program: { select: { id: true, code: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found.`);
    }

    // Find active enrollments
    const enrollments = await this.db.enrollment.findMany({
      where: {
        studentId,
        status: 'ENROLLED',
        semesterId: semesterId || undefined,
      },
      select: { classSectionId: true },
    });

    const sectionIds = enrollments.map((e) => e.classSectionId);

    const slots = await this.db.timetableSlot.findMany({
      where: {
        classSectionId: { in: sectionIds },
      },
      include: {
        room: true,
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    const weeklyMatrix = this.buildWeeklyMatrix(slots);
    const totalWeeklySessions = slots.length;

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber,
        program: student.program.name,
      },
      semesterId,
      totalEnrolledCourses: sectionIds.length,
      totalWeeklySessions,
      schedule: weeklyMatrix,
    };
  }

  /**
   * View 2: Lecturer Teaching Schedule
   */
  async getLecturerTimetable(staffId: string, semesterId?: string) {
    const staff = await this.db.staff.findUnique({
      where: { id: staffId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { id: true, code: true, name: true } },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Lecturer/Staff ${staffId} not found.`);
    }

    const where: any = {
      classSection: {
        primaryLecturerId: staffId,
      },
    };

    if (semesterId) {
      where.classSection.semesterId = semesterId;
    }

    const slots = await this.db.timetableSlot.findMany({
      where,
      include: {
        room: true,
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    return {
      lecturer: {
        id: staff.id,
        name: `${staff.user.firstName} ${staff.user.lastName}`,
        staffNumber: staff.staffNumber,
        department: staff.department.name,
        designation: staff.designation,
      },
      semesterId,
      totalAssignedSlots: slots.length,
      schedule: this.buildWeeklyMatrix(slots),
    };
  }

  /**
   * View 3: Room Availability Schedule
   */
  async getRoomTimetable(roomId: string, semesterId?: string) {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      include: { campus: true },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found.`);
    }

    const where: any = { roomId };
    if (semesterId) {
      where.classSection = { semesterId };
    }

    const slots = await this.db.timetableSlot.findMany({
      where,
      include: {
        room: true,
        classSection: {
          include: {
            course: true,
            primaryLecturer: { include: { user: true } },
          },
        },
      },
    });

    return {
      room: {
        id: room.id,
        building: room.building,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        roomType: room.roomType,
        campus: room.campus.name,
      },
      semesterId,
      totalBookedSlots: slots.length,
      schedule: this.buildWeeklyMatrix(slots),
    };
  }

  /**
   * View 4: Master Campus / Institutional Timetable Matrix
   */
  async getMasterTimetable(filter: TimetableFilterDto) {
    const where: any = {};

    if (filter.dayOfWeek) {
      where.dayOfWeek = filter.dayOfWeek;
    }

    if (filter.roomId) {
      where.roomId = filter.roomId;
    }

    const sectionWhere: any = {};
    if (filter.semesterId) sectionWhere.semesterId = filter.semesterId;
    if (filter.campusId) sectionWhere.campusId = filter.campusId;
    if (filter.lecturerId) sectionWhere.primaryLecturerId = filter.lecturerId;
    if (filter.departmentId) {
      sectionWhere.course = { departmentId: filter.departmentId };
    }

    if (Object.keys(sectionWhere).length > 0) {
      where.classSection = sectionWhere;
    }

    const slots = await this.db.timetableSlot.findMany({
      where,
      include: {
        room: { include: { campus: true } },
        classSection: {
          include: {
            course: { include: { department: true } },
            primaryLecturer: { include: { user: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return {
      filtersApplied: filter,
      totalSlotsFound: slots.length,
      schedule: this.buildWeeklyMatrix(slots),
    };
  }
}
