import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  AddPrerequisiteDto,
  CreateCurriculumVersionDto,
  AddCurriculumCourseDto,
} from './dto/curriculum.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuditLogAction } from '../../common/decorators/audit.decorator';
import { PermissionAction, PermissionResource } from '@edutech/common';

@ApiTags('Curriculum & Course Catalogue')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // ==========================================
  // COURSES
  // ==========================================

  @Get('courses')
  @ApiOperation({ summary: 'List courses with search and filters' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'level', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.VIEW })
  async listCourses(
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.curriculumService.listCourses({
      departmentId,
      level: level ? parseInt(level, 10) : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course details with prerequisites and sections' })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.VIEW })
  async getCourseById(@Param('id') id: string) {
    return this.curriculumService.getCourseById(id);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create new course in catalogue' })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_COURSE', 'COURSE')
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.curriculumService.createCourse(dto);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update course details' })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_COURSE', 'COURSE')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.curriculumService.updateCourse(id, dto);
  }

  // ==========================================
  // PREREQUISITES & GRAPH
  // ==========================================

  @Post('courses/:id/prerequisites')
  @ApiOperation({ summary: 'Add course prerequisite with cycle detection' })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.EDIT })
  @AuditLogAction('ADD_COURSE_PREREQUISITE', 'COURSE')
  async addPrerequisite(
    @Param('id') courseId: string,
    @Body() dto: AddPrerequisiteDto,
  ) {
    return this.curriculumService.addPrerequisite(courseId, dto);
  }

  @Delete('courses/:id/prerequisites/:prereqCourseId')
  @ApiOperation({ summary: 'Remove course prerequisite' })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.EDIT })
  @AuditLogAction('REMOVE_COURSE_PREREQUISITE', 'COURSE')
  async removePrerequisite(
    @Param('id') courseId: string,
    @Param('prereqCourseId') prereqCourseId: string,
  ) {
    return this.curriculumService.removePrerequisite(courseId, prereqCourseId);
  }

  @Get('courses/:id/prerequisite-graph')
  @ApiOperation({ summary: 'Get full multi-tier prerequisite graph for a course' })
  @RequirePermissions({ resource: PermissionResource.COURSE, action: PermissionAction.VIEW })
  async getPrerequisiteGraph(@Param('id') courseId: string) {
    return this.curriculumService.getPrerequisiteGraph(courseId);
  }

  // ==========================================
  // CURRICULUM VERSIONS & AUDIT
  // ==========================================

  @Get('programs/:programId/versions')
  @ApiOperation({ summary: 'List curriculum versions for a program' })
  @RequirePermissions({ resource: PermissionResource.CURRICULUM, action: PermissionAction.VIEW })
  async listCurriculumVersions(@Param('programId') programId: string) {
    return this.curriculumService.listCurriculumVersions(programId);
  }

  @Get('versions/:id')
  @ApiOperation({ summary: 'Get curriculum version details and semester layout' })
  @RequirePermissions({ resource: PermissionResource.CURRICULUM, action: PermissionAction.VIEW })
  async getCurriculumVersionById(@Param('id') id: string) {
    return this.curriculumService.getCurriculumVersionById(id);
  }

  @Post('programs/:programId/versions')
  @ApiOperation({ summary: 'Create new curriculum version for a program' })
  @RequirePermissions({ resource: PermissionResource.CURRICULUM, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_CURRICULUM_VERSION', 'CURRICULUM')
  async createCurriculumVersion(
    @Param('programId') programId: string,
    @Body() dto: CreateCurriculumVersionDto,
  ) {
    return this.curriculumService.createCurriculumVersion(programId, dto);
  }

  @Post('versions/:id/courses')
  @ApiOperation({ summary: 'Add course to curriculum version' })
  @RequirePermissions({ resource: PermissionResource.CURRICULUM, action: PermissionAction.EDIT })
  @AuditLogAction('ADD_CURRICULUM_COURSE', 'CURRICULUM')
  async addCourseToCurriculum(
    @Param('id') versionId: string,
    @Body() dto: AddCurriculumCourseDto,
  ) {
    return this.curriculumService.addCourseToCurriculum(versionId, dto);
  }

  @Delete('versions/:id/courses/:courseId')
  @ApiOperation({ summary: 'Remove course from curriculum version' })
  @RequirePermissions({ resource: PermissionResource.CURRICULUM, action: PermissionAction.EDIT })
  @AuditLogAction('REMOVE_CURRICULUM_COURSE', 'CURRICULUM')
  async removeCourseFromCurriculum(
    @Param('id') versionId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.curriculumService.removeCourseFromCurriculum(versionId, courseId);
  }

  @Get('versions/:id/audit')
  @ApiOperation({ summary: 'Perform comprehensive academic audit on curriculum version' })
  @RequirePermissions({ resource: PermissionResource.CURRICULUM, action: PermissionAction.VIEW })
  async auditCurriculum(@Param('id') id: string) {
    return this.curriculumService.auditCurriculum(id);
  }
}
