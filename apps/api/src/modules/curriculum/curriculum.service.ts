import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  AddPrerequisiteDto,
  CreateCurriculumVersionDto,
  AddCurriculumCourseDto,
} from './dto/curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private db: DatabaseService) {}

  // ==========================================
  // COURSES MANAGEMENT
  // ==========================================

  async listCourses(params?: {
    departmentId?: string;
    level?: number;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(1, params?.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.departmentId) where.departmentId = params.departmentId;
    if (params?.level) where.level = params.level;
    if (params?.isActive !== undefined) where.isActive = params.isActive;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, courses] = await Promise.all([
      this.db.course.count({ where }),
      this.db.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: {
            select: { id: true, code: true, name: true },
          },
          prerequisites: {
            include: {
              prerequisiteCourse: {
                select: { id: true, code: true, title: true, creditHours: true },
              },
            },
          },
          _count: {
            select: {
              classSections: true,
              curriculumCourses: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      }),
    ]);

    return {
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseById(id: string) {
    const course = await this.db.course.findUnique({
      where: { id },
      include: {
        department: {
          include: { faculty: { include: { campus: true } } },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: { id: true, code: true, title: true, creditHours: true, level: true },
            },
          },
        },
        prerequisiteFor: {
          include: {
            course: {
              select: { id: true, code: true, title: true, creditHours: true, level: true },
            },
          },
        },
        classSections: {
          where: { semester: { isClosed: false } },
          include: {
            semester: true,
            campus: true,
            primaryLecturer: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }
    return course;
  }

  async createCourse(dto: CreateCourseDto) {
    const dept = await this.db.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) {
      throw new NotFoundException(`Department with ID '${dto.departmentId}' not found`);
    }

    const existing = await this.db.course.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Course code '${dto.code}' already exists`);
    }

    return this.db.course.create({
      data: {
        departmentId: dto.departmentId,
        code: dto.code.toUpperCase(),
        title: dto.title,
        description: dto.description,
        creditHours: dto.creditHours || 3,
        contactHours: dto.contactHours || 3,
        level: dto.level || 100,
        isActive: true,
      },
    });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.getCourseById(id);
    return this.db.course.update({
      where: { id },
      data: dto,
    });
  }

  // ==========================================
  // PREREQUISITE GRAPH ENGINE & CYCLE CHECK
  // ==========================================

  /**
   * Adds a prerequisite requirement to a course with graph cycle detection.
   */
  async addPrerequisite(courseId: string, dto: AddPrerequisiteDto) {
    if (courseId === dto.prerequisiteCourseId) {
      throw new BadRequestException('A course cannot be a prerequisite of itself');
    }

    const [course, prereqCourse] = await Promise.all([
      this.db.course.findUnique({ where: { id: courseId } }),
      this.db.course.findUnique({ where: { id: dto.prerequisiteCourseId } }),
    ]);

    if (!course) {
      throw new NotFoundException(`Target course with ID '${courseId}' not found`);
    }
    if (!prereqCourse) {
      throw new NotFoundException(
        `Prerequisite course with ID '${dto.prerequisiteCourseId}' not found`,
      );
    }

    // Check if prerequisite already exists
    const existing = await this.db.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteCourseId: {
          courseId,
          prerequisiteCourseId: dto.prerequisiteCourseId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Course '${prereqCourse.code}' is already a prerequisite for '${course.code}'`,
      );
    }

    // =========================================================================
    // GRAPH CYCLE DETECTION: BFS
    // We check if courseId is already reachable from prerequisiteCourseId.
    // If courseId is reachable from prerequisiteCourseId, then prerequisiteCourseId
    // already (directly or transitively) depends on courseId.
    // Adding courseId -> prerequisiteCourseId would create a directed loop.
    // =========================================================================
    const visited = new Set<string>();
    const queue: string[] = [dto.prerequisiteCourseId];
    visited.add(dto.prerequisiteCourseId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const upstreamPrereqs = await this.db.coursePrerequisite.findMany({
        where: { courseId: current },
        select: { prerequisiteCourseId: true },
      });

      for (const p of upstreamPrereqs) {
        if (p.prerequisiteCourseId === courseId) {
          throw new BadRequestException(
            `Cyclic prerequisite dependency detected: Course '${course.code}' is already a required prerequisite of '${prereqCourse.code}'. Adding this rule would create an unresolvable academic loop.`,
          );
        }
        if (!visited.has(p.prerequisiteCourseId)) {
          visited.add(p.prerequisiteCourseId);
          queue.push(p.prerequisiteCourseId);
        }
      }
    }

    return this.db.coursePrerequisite.create({
      data: {
        courseId,
        prerequisiteCourseId: dto.prerequisiteCourseId,
        minGradeRequired: dto.minGradeRequired || 'D',
        type: dto.type || 'PREREQUISITE',
      },
      include: {
        prerequisiteCourse: {
          select: { id: true, code: true, title: true, creditHours: true },
        },
      },
    });
  }

  async removePrerequisite(courseId: string, prerequisiteCourseId: string) {
    const existing = await this.db.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteCourseId: {
          courseId,
          prerequisiteCourseId,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Prerequisite requirement not found');
    }

    await this.db.coursePrerequisite.delete({
      where: {
        courseId_prerequisiteCourseId: {
          courseId,
          prerequisiteCourseId,
        },
      },
    });

    return { message: 'Prerequisite requirement removed successfully' };
  }

  /**
   * Returns the multi-level prerequisite dependency DAG for a course.
   */
  async getPrerequisiteGraph(courseId: string) {
    const course = await this.db.course.findUnique({
      where: { id: courseId },
      select: { id: true, code: true, title: true, creditHours: true, level: true },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID '${courseId}' not found`);
    }

    const nodesMap = new Map<string, any>();
    const edges: Array<{ from: string; to: string; type: string; minGrade: string }> = [];

    nodesMap.set(course.id, { ...course, isTarget: true, depth: 0 });

    const queue: Array<{ id: string; depth: number }> = [{ id: course.id, depth: 0 }];
    const visited = new Set<string>([course.id]);

    while (queue.length > 0) {
      const { id: currentId, depth } = queue.shift()!;
      const prereqs = await this.db.coursePrerequisite.findMany({
        where: { courseId: currentId },
        include: {
          prerequisiteCourse: {
            select: { id: true, code: true, title: true, creditHours: true, level: true },
          },
        },
      });

      for (const req of prereqs) {
        edges.push({
          from: currentId,
          to: req.prerequisiteCourse.id,
          type: req.type,
          minGrade: req.minGradeRequired,
        });

        if (!nodesMap.has(req.prerequisiteCourse.id)) {
          nodesMap.set(req.prerequisiteCourse.id, {
            ...req.prerequisiteCourse,
            isTarget: false,
            depth: depth + 1,
          });
        }

        if (!visited.has(req.prerequisiteCourse.id)) {
          visited.add(req.prerequisiteCourse.id);
          queue.push({ id: req.prerequisiteCourse.id, depth: depth + 1 });
        }
      }
    }

    return {
      targetCourse: course,
      totalPrerequisites: nodesMap.size - 1,
      nodes: Array.from(nodesMap.values()),
      edges,
    };
  }

  // ==========================================
  // CURRICULUM VERSIONS & AUDIT
  // ==========================================

  async listCurriculumVersions(programId: string) {
    const program = await this.db.program.findUnique({ where: { id: programId } });
    if (!program) {
      throw new NotFoundException(`Program with ID '${programId}' not found`);
    }

    return this.db.curriculumVersion.findMany({
      where: { programId },
      include: {
        _count: { select: { curriculumCourses: true } },
      },
      orderBy: { academicYear: 'desc' },
    });
  }

  async getCurriculumVersionById(id: string) {
    const version = await this.db.curriculumVersion.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            department: {
              include: { faculty: { include: { campus: true } } },
            },
          },
        },
        curriculumCourses: {
          include: {
            course: {
              include: {
                prerequisites: {
                  include: {
                    prerequisiteCourse: { select: { id: true, code: true, title: true } },
                  },
                },
              },
            },
          },
          orderBy: [
            { yearOfStudy: 'asc' },
            { semesterNumber: 'asc' },
            { isCore: 'desc' },
          ],
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Curriculum version with ID '${id}' not found`);
    }

    // Group courses by Year of Study and Semester
    const termsMap: Record<string, any[]> = {};
    let totalCoreCredits = 0;
    let totalElectiveCredits = 0;

    for (const item of version.curriculumCourses) {
      const termKey = `Year ${item.yearOfStudy}, Semester ${item.semesterNumber}`;
      if (!termsMap[termKey]) {
        termsMap[termKey] = [];
      }
      termsMap[termKey].push(item);

      if (item.isCore) {
        totalCoreCredits += item.course.creditHours;
      } else {
        totalElectiveCredits += item.course.creditHours;
      }
    }

    return {
      ...version,
      summary: {
        totalCourses: version.curriculumCourses.length,
        totalCoreCredits,
        totalElectiveCredits,
        totalCredits: totalCoreCredits + totalElectiveCredits,
        requiredCredits: version.program.totalCreditsRequired,
      },
      terms: termsMap,
    };
  }

  async createCurriculumVersion(programId: string, dto: CreateCurriculumVersionDto) {
    const program = await this.db.program.findUnique({ where: { id: programId } });
    if (!program) {
      throw new NotFoundException(`Program with ID '${programId}' not found`);
    }

    const existing = await this.db.curriculumVersion.findUnique({
      where: {
        programId_versionName: {
          programId,
          versionName: dto.versionName,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Curriculum version '${dto.versionName}' already exists for program '${program.code}'`,
      );
    }

    return this.db.curriculumVersion.create({
      data: {
        programId,
        versionName: dto.versionName,
        academicYear: dto.academicYear,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async addCourseToCurriculum(versionId: string, dto: AddCurriculumCourseDto) {
    const [version, course] = await Promise.all([
      this.db.curriculumVersion.findUnique({ where: { id: versionId } }),
      this.db.course.findUnique({ where: { id: dto.courseId } }),
    ]);

    if (!version) {
      throw new NotFoundException(`Curriculum version with ID '${versionId}' not found`);
    }
    if (!course) {
      throw new NotFoundException(`Course with ID '${dto.courseId}' not found`);
    }

    const existing = await this.db.curriculumCourse.findUnique({
      where: {
        curriculumVersionId_courseId: {
          curriculumVersionId: versionId,
          courseId: dto.courseId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Course '${course.code}' is already assigned to this curriculum version`,
      );
    }

    return this.db.curriculumCourse.create({
      data: {
        curriculumVersionId: versionId,
        courseId: dto.courseId,
        yearOfStudy: dto.yearOfStudy || 1,
        semesterNumber: dto.semesterNumber || 1,
        isCore: dto.isCore !== undefined ? dto.isCore : true,
      },
      include: {
        course: true,
      },
    });
  }

  async removeCourseFromCurriculum(versionId: string, courseId: string) {
    const existing = await this.db.curriculumCourse.findUnique({
      where: {
        curriculumVersionId_courseId: {
          curriculumVersionId: versionId,
          courseId,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Course mapping not found in this curriculum version');
    }

    await this.db.curriculumCourse.delete({
      where: {
        curriculumVersionId_courseId: {
          curriculumVersionId: versionId,
          courseId,
        },
      },
    });

    return { message: 'Course removed from curriculum version successfully' };
  }

  /**
   * Enterprise academic audit of a curriculum version:
   * - Verifies total credits meet degree requirements
   * - Validates prerequisite sequencing (prerequisites must be scheduled before dependent courses)
   */
  async auditCurriculum(versionId: string) {
    const version = await this.db.curriculumVersion.findUnique({
      where: { id: versionId },
      include: {
        program: true,
        curriculumCourses: {
          include: {
            course: {
              include: {
                prerequisites: {
                  include: {
                    prerequisiteCourse: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Curriculum version with ID '${versionId}' not found`);
    }

    const coursePlacementMap = new Map<
      string,
      { yearOfStudy: number; semesterNumber: number; courseCode: string }
    >();

    let totalCoreCredits = 0;
    let totalElectiveCredits = 0;

    for (const cc of version.curriculumCourses) {
      coursePlacementMap.set(cc.courseId, {
        yearOfStudy: cc.yearOfStudy,
        semesterNumber: cc.semesterNumber,
        courseCode: cc.course.code,
      });

      if (cc.isCore) {
        totalCoreCredits += cc.course.creditHours;
      } else {
        totalElectiveCredits += cc.course.creditHours;
      }
    }

    const totalCredits = totalCoreCredits + totalElectiveCredits;
    const requiredCredits = version.program.totalCreditsRequired;
    const creditsDeficit = Math.max(0, requiredCredits - totalCredits);

    const issues: Array<{
      type: 'PREREQUISITE_SEQUENCE_VIOLATION' | 'EXTERNAL_PREREQUISITE' | 'CREDIT_DEFICIT';
      courseCode: string;
      message: string;
    }> = [];

    if (totalCredits < requiredCredits) {
      issues.push({
        type: 'CREDIT_DEFICIT',
        courseCode: version.program.code,
        message: `Curriculum total credits (${totalCredits}) is less than required program credits (${requiredCredits}). Deficit of ${creditsDeficit} credit hours.`,
      });
    }

    for (const cc of version.curriculumCourses) {
      for (const req of cc.course.prerequisites) {
        const prereqPlacement = coursePlacementMap.get(req.prerequisiteCourseId);
        if (!prereqPlacement) {
          issues.push({
            type: 'EXTERNAL_PREREQUISITE',
            courseCode: cc.course.code,
            message: `Prerequisite '${req.prerequisiteCourse.code}' is not included in this curriculum version.`,
          });
        } else {
          // Verify prerequisite appears before this course
          const prereqTermWeight = prereqPlacement.yearOfStudy * 10 + prereqPlacement.semesterNumber;
          const currentTermWeight = cc.yearOfStudy * 10 + cc.semesterNumber;

          if (prereqTermWeight >= currentTermWeight) {
            issues.push({
              type: 'PREREQUISITE_SEQUENCE_VIOLATION',
              courseCode: cc.course.code,
              message: `Course '${cc.course.code}' is scheduled in Year ${cc.yearOfStudy} Sem ${cc.semesterNumber}, but its prerequisite '${req.prerequisiteCourse.code}' is scheduled concurrently or later (Year ${prereqPlacement.yearOfStudy} Sem ${prereqPlacement.semesterNumber}).`,
            });
          }
        }
      }
    }

    return {
      curriculumVersionId: version.id,
      programCode: version.program.code,
      programName: version.program.name,
      degreeLevel: version.program.degreeLevel,
      isValid: issues.length === 0,
      totalCoreCredits,
      totalElectiveCredits,
      totalCredits,
      requiredCredits,
      creditsDeficit,
      issuesCount: issues.length,
      issues,
    };
  }
}
