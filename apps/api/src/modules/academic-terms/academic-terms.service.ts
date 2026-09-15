import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSemesterDto,
  UpdateSemesterDto,
} from './dto/academic-terms.dto';

@Injectable()
export class AcademicTermsService {
  constructor(private db: DatabaseService) {}

  // ==========================================
  // ACADEMIC YEARS
  // ==========================================

  async listAcademicYears() {
    return this.db.academicYear.findMany({
      include: {
        semesters: {
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: { semesters: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getCurrentAcademicYear() {
    const current = await this.db.academicYear.findFirst({
      where: { isCurrent: true },
      include: {
        semesters: {
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!current) {
      throw new NotFoundException('No active current academic year configured');
    }
    return current;
  }

  async getAcademicYearById(id: string) {
    const year = await this.db.academicYear.findUnique({
      where: { id },
      include: {
        semesters: {
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!year) {
      throw new NotFoundException(`Academic Year with ID '${id}' not found`);
    }
    return year;
  }

  async createAcademicYear(dto: CreateAcademicYearDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException('Academic year start date must be before end date');
    }

    const existing = await this.db.academicYear.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Academic Year '${dto.name}' already exists`);
    }

    return this.db.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.create({
        data: {
          name: dto.name,
          startDate: start,
          endDate: end,
          isCurrent: dto.isCurrent || false,
        },
      });
    });
  }

  async updateAcademicYear(id: string, dto: UpdateAcademicYearDto) {
    await this.getAcademicYearById(id);

    const start = dto.startDate ? new Date(dto.startDate) : undefined;
    const end = dto.endDate ? new Date(dto.endDate) : undefined;
    if (start && end && start >= end) {
      throw new BadRequestException('Academic year start date must be before end date');
    }

    return this.db.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { id: { not: id } },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.update({
        where: { id },
        data: {
          name: dto.name,
          startDate: start,
          endDate: end,
          isCurrent: dto.isCurrent,
        },
      });
    });
  }

  // ==========================================
  // SEMESTERS
  // ==========================================

  async listSemesters(academicYearId?: string, isClosed?: boolean) {
    return this.db.semester.findMany({
      where: {
        academicYearId: academicYearId || undefined,
        isClosed: isClosed !== undefined ? isClosed : undefined,
      },
      include: {
        academicYear: {
          select: { id: true, name: true, isCurrent: true },
        },
        _count: {
          select: {
            classSections: true,
            enrollments: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getSemesterById(id: string) {
    const sem = await this.db.semester.findUnique({
      where: { id },
      include: {
        academicYear: true,
        _count: {
          select: {
            classSections: true,
            enrollments: true,
          },
        },
      },
    });
    if (!sem) {
      throw new NotFoundException(`Semester with ID '${id}' not found`);
    }
    return sem;
  }

  async createSemester(dto: CreateSemesterDto) {
    const year = await this.db.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!year) {
      throw new NotFoundException(`Academic Year with ID '${dto.academicYearId}' not found`);
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const regStart = new Date(dto.registrationStart);
    const regEnd = new Date(dto.registrationEnd);

    if (start >= end) {
      throw new BadRequestException('Semester start date must be before end date');
    }
    if (regStart >= regEnd) {
      throw new BadRequestException('Registration start must be before registration end');
    }

    const existing = await this.db.semester.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Semester code '${dto.code}' already exists`);
    }

    return this.db.semester.create({
      data: {
        academicYearId: dto.academicYearId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        startDate: start,
        endDate: end,
        registrationStart: regStart,
        registrationEnd: regEnd,
        isClosed: false,
      },
    });
  }

  async updateSemester(id: string, dto: UpdateSemesterDto) {
    await this.getSemesterById(id);

    return this.db.semester.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        registrationStart: dto.registrationStart ? new Date(dto.registrationStart) : undefined,
        registrationEnd: dto.registrationEnd ? new Date(dto.registrationEnd) : undefined,
        isClosed: dto.isClosed,
      },
    });
  }
}
