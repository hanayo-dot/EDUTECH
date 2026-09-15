import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateCampusDto,
  UpdateCampusDto,
  CreateFacultyDto,
  UpdateFacultyDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateProgramDto,
  UpdateProgramDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private db: DatabaseService) {}

  /**
   * Returns the institutional organizational tree (Institution -> Campuses -> Faculties -> Departments -> Programs)
   */
  async getHierarchy() {
    const institution = await this.db.institution.findFirst({
      include: {
        campuses: {
          where: { isActive: true },
          include: {
            faculties: {
              where: { isActive: true },
              include: {
                departments: {
                  where: { isActive: true },
                  include: {
                    programs: {
                      where: { isActive: true },
                      orderBy: { code: 'asc' },
                    },
                  },
                  orderBy: { code: 'asc' },
                },
              },
              orderBy: { code: 'asc' },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Institution record not initialized');
    }

    return institution;
  }

  // ==========================================
  // CAMPUS MANAGEMENT
  // ==========================================

  async listCampuses() {
    return this.db.campus.findMany({
      include: {
        _count: {
          select: {
            faculties: true,
            students: true,
            rooms: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getCampusById(id: string) {
    const campus = await this.db.campus.findUnique({
      where: { id },
      include: {
        faculties: {
          include: {
            departments: true,
          },
        },
      },
    });
    if (!campus) {
      throw new NotFoundException(`Campus with ID '${id}' not found`);
    }
    return campus;
  }

  async createCampus(dto: CreateCampusDto) {
    const institution = await this.db.institution.findFirst();
    if (!institution) {
      throw new BadRequestException('Primary institution not initialized');
    }

    const existing = await this.db.campus.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Campus code '${dto.code}' already exists`);
    }

    return this.db.campus.create({
      data: {
        institutionId: institution.id,
        code: dto.code.toUpperCase(),
        name: dto.name,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        timezone: dto.timezone || 'UTC',
      },
    });
  }

  async updateCampus(id: string, dto: UpdateCampusDto) {
    await this.getCampusById(id);
    return this.db.campus.update({
      where: { id },
      data: dto,
    });
  }

  // ==========================================
  // FACULTY MANAGEMENT
  // ==========================================

  async listFaculties(campusId?: string) {
    return this.db.faculty.findMany({
      where: campusId ? { campusId } : undefined,
      include: {
        campus: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { departments: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getFacultyById(id: string) {
    const faculty = await this.db.faculty.findUnique({
      where: { id },
      include: {
        campus: true,
        departments: {
          include: {
            programs: true,
          },
        },
      },
    });
    if (!faculty) {
      throw new NotFoundException(`Faculty with ID '${id}' not found`);
    }
    return faculty;
  }

  async createFaculty(dto: CreateFacultyDto) {
    const campus = await this.db.campus.findUnique({ where: { id: dto.campusId } });
    if (!campus) {
      throw new NotFoundException(`Campus with ID '${dto.campusId}' not found`);
    }

    const existing = await this.db.faculty.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Faculty code '${dto.code}' already exists`);
    }

    return this.db.faculty.create({
      data: {
        campusId: dto.campusId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        deanId: dto.deanId,
      },
    });
  }

  async updateFaculty(id: string, dto: UpdateFacultyDto) {
    await this.getFacultyById(id);
    return this.db.faculty.update({
      where: { id },
      data: dto,
    });
  }

  // ==========================================
  // DEPARTMENT MANAGEMENT
  // ==========================================

  async listDepartments(facultyId?: string) {
    return this.db.department.findMany({
      where: facultyId ? { facultyId } : undefined,
      include: {
        faculty: {
          select: { id: true, code: true, name: true, campusId: true },
        },
        _count: {
          select: { programs: true, courses: true, staff: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getDepartmentById(id: string) {
    const dept = await this.db.department.findUnique({
      where: { id },
      include: {
        faculty: { include: { campus: true } },
        programs: true,
        courses: true,
      },
    });
    if (!dept) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }
    return dept;
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const faculty = await this.db.faculty.findUnique({ where: { id: dto.facultyId } });
    if (!faculty) {
      throw new NotFoundException(`Faculty with ID '${dto.facultyId}' not found`);
    }

    const existing = await this.db.department.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Department code '${dto.code}' already exists`);
    }

    return this.db.department.create({
      data: {
        facultyId: dto.facultyId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        hodId: dto.hodId,
      },
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.getDepartmentById(id);
    return this.db.department.update({
      where: { id },
      data: dto,
    });
  }

  // ==========================================
  // PROGRAM MANAGEMENT
  // ==========================================

  async listPrograms(departmentId?: string) {
    return this.db.program.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: {
          select: { id: true, code: true, name: true, facultyId: true },
        },
        _count: {
          select: {
            students: true,
            curriculumVersions: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getProgramById(id: string) {
    const program = await this.db.program.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            faculty: { include: { campus: true } },
          },
        },
        curriculumVersions: {
          include: {
            _count: { select: { curriculumCourses: true } },
          },
        },
      },
    });
    if (!program) {
      throw new NotFoundException(`Program with ID '${id}' not found`);
    }
    return program;
  }

  async createProgram(dto: CreateProgramDto) {
    const dept = await this.db.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) {
      throw new NotFoundException(`Department with ID '${dto.departmentId}' not found`);
    }

    const existing = await this.db.program.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Program code '${dto.code}' already exists`);
    }

    return this.db.program.create({
      data: {
        departmentId: dto.departmentId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        degreeLevel: dto.degreeLevel.toUpperCase(),
        durationYears: dto.durationYears || 4,
        totalCreditsRequired: dto.totalCreditsRequired || 120,
      },
    });
  }

  async updateProgram(id: string, dto: UpdateProgramDto) {
    await this.getProgramById(id);
    return this.db.program.update({
      where: { id },
      data: {
        ...dto,
        degreeLevel: dto.degreeLevel ? dto.degreeLevel.toUpperCase() : undefined,
      },
    });
  }
}
