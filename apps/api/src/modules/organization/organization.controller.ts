import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
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
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuditLogAction } from '../../common/decorators/audit.decorator';
import { PermissionAction, PermissionResource } from '@chuoms/common';

@ApiTags('Organization & Multi-Campus Hierarchy')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get full institutional organizational tree' })
  @RequirePermissions({ resource: PermissionResource.CAMPUS, action: PermissionAction.VIEW })
  async getHierarchy() {
    return this.orgService.getHierarchy();
  }

  // --- Campuses ---

  @Get('campuses')
  @ApiOperation({ summary: 'List all campuses' })
  @RequirePermissions({ resource: PermissionResource.CAMPUS, action: PermissionAction.VIEW })
  async listCampuses() {
    return this.orgService.listCampuses();
  }

  @Get('campuses/:id')
  @ApiOperation({ summary: 'Get single campus details' })
  @RequirePermissions({ resource: PermissionResource.CAMPUS, action: PermissionAction.VIEW })
  async getCampusById(@Param('id') id: string) {
    return this.orgService.getCampusById(id);
  }

  @Post('campuses')
  @ApiOperation({ summary: 'Create new campus' })
  @RequirePermissions({ resource: PermissionResource.CAMPUS, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_CAMPUS', 'CAMPUS')
  async createCampus(@Body() dto: CreateCampusDto) {
    return this.orgService.createCampus(dto);
  }

  @Patch('campuses/:id')
  @ApiOperation({ summary: 'Update campus' })
  @RequirePermissions({ resource: PermissionResource.CAMPUS, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_CAMPUS', 'CAMPUS')
  async updateCampus(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.orgService.updateCampus(id, dto);
  }

  // --- Faculties ---

  @Get('faculties')
  @ApiOperation({ summary: 'List faculties' })
  @ApiQuery({ name: 'campusId', required: false })
  @RequirePermissions({ resource: PermissionResource.FACULTY, action: PermissionAction.VIEW })
  async listFaculties(@Query('campusId') campusId?: string) {
    return this.orgService.listFaculties(campusId);
  }

  @Get('faculties/:id')
  @ApiOperation({ summary: 'Get single faculty details' })
  @RequirePermissions({ resource: PermissionResource.FACULTY, action: PermissionAction.VIEW })
  async getFacultyById(@Param('id') id: string) {
    return this.orgService.getFacultyById(id);
  }

  @Post('faculties')
  @ApiOperation({ summary: 'Create new faculty' })
  @RequirePermissions({ resource: PermissionResource.FACULTY, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_FACULTY', 'FACULTY')
  async createFaculty(@Body() dto: CreateFacultyDto) {
    return this.orgService.createFaculty(dto);
  }

  @Patch('faculties/:id')
  @ApiOperation({ summary: 'Update faculty' })
  @RequirePermissions({ resource: PermissionResource.FACULTY, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_FACULTY', 'FACULTY')
  async updateFaculty(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.orgService.updateFaculty(id, dto);
  }

  // --- Departments ---

  @Get('departments')
  @ApiOperation({ summary: 'List departments' })
  @ApiQuery({ name: 'facultyId', required: false })
  @RequirePermissions({ resource: PermissionResource.DEPARTMENT, action: PermissionAction.VIEW })
  async listDepartments(@Query('facultyId') facultyId?: string) {
    return this.orgService.listDepartments(facultyId);
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get single department details' })
  @RequirePermissions({ resource: PermissionResource.DEPARTMENT, action: PermissionAction.VIEW })
  async getDepartmentById(@Param('id') id: string) {
    return this.orgService.getDepartmentById(id);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create new department' })
  @RequirePermissions({ resource: PermissionResource.DEPARTMENT, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_DEPARTMENT', 'DEPARTMENT')
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.orgService.createDepartment(dto);
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'Update department' })
  @RequirePermissions({ resource: PermissionResource.DEPARTMENT, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_DEPARTMENT', 'DEPARTMENT')
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.orgService.updateDepartment(id, dto);
  }

  // --- Programs ---

  @Get('programs')
  @ApiOperation({ summary: 'List academic programs' })
  @ApiQuery({ name: 'departmentId', required: false })
  @RequirePermissions({ resource: PermissionResource.PROGRAM, action: PermissionAction.VIEW })
  async listPrograms(@Query('departmentId') departmentId?: string) {
    return this.orgService.listPrograms(departmentId);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get single program details' })
  @RequirePermissions({ resource: PermissionResource.PROGRAM, action: PermissionAction.VIEW })
  async getProgramById(@Param('id') id: string) {
    return this.orgService.getProgramById(id);
  }

  @Post('programs')
  @ApiOperation({ summary: 'Create academic program' })
  @RequirePermissions({ resource: PermissionResource.PROGRAM, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_PROGRAM', 'PROGRAM')
  async createProgram(@Body() dto: CreateProgramDto) {
    return this.orgService.createProgram(dto);
  }

  @Patch('programs/:id')
  @ApiOperation({ summary: 'Update academic program' })
  @RequirePermissions({ resource: PermissionResource.PROGRAM, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_PROGRAM', 'PROGRAM')
  async updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.orgService.updateProgram(id, dto);
  }
}
