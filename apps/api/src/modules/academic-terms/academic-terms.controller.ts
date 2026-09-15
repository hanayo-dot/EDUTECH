import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AcademicTermsService } from './academic-terms.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSemesterDto,
  UpdateSemesterDto,
} from './dto/academic-terms.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuditLogAction } from '../../common/decorators/audit.decorator';
import { PermissionAction, PermissionResource } from '@chuoms/common';

@ApiTags('Academic Calendar & Terms')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('academic-terms')
export class AcademicTermsController {
  constructor(private readonly termsService: AcademicTermsService) {}

  // --- Academic Years ---

  @Get('years')
  @ApiOperation({ summary: 'List all academic years' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.VIEW })
  async listAcademicYears() {
    return this.termsService.listAcademicYears();
  }

  @Get('years/current')
  @ApiOperation({ summary: 'Get current active academic year' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.VIEW })
  async getCurrentAcademicYear() {
    return this.termsService.getCurrentAcademicYear();
  }

  @Get('years/:id')
  @ApiOperation({ summary: 'Get academic year by ID' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.VIEW })
  async getAcademicYearById(@Param('id') id: string) {
    return this.termsService.getAcademicYearById(id);
  }

  @Post('years')
  @ApiOperation({ summary: 'Create new academic year' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_ACADEMIC_YEAR', 'SEMESTER')
  async createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.termsService.createAcademicYear(dto);
  }

  @Patch('years/:id')
  @ApiOperation({ summary: 'Update academic year' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_ACADEMIC_YEAR', 'SEMESTER')
  async updateAcademicYear(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.termsService.updateAcademicYear(id, dto);
  }

  // --- Semesters ---

  @Get('semesters')
  @ApiOperation({ summary: 'List semesters' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'isClosed', required: false, type: Boolean })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.VIEW })
  async listSemesters(
    @Query('academicYearId') academicYearId?: string,
    @Query('isClosed') isClosed?: string,
  ) {
    const isClosedBool = isClosed !== undefined ? isClosed === 'true' : undefined;
    return this.termsService.listSemesters(academicYearId, isClosedBool);
  }

  @Get('semesters/:id')
  @ApiOperation({ summary: 'Get semester details by ID' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.VIEW })
  async getSemesterById(@Param('id') id: string) {
    return this.termsService.getSemesterById(id);
  }

  @Post('semesters')
  @ApiOperation({ summary: 'Create new semester' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.CREATE })
  @AuditLogAction('CREATE_SEMESTER', 'SEMESTER')
  async createSemester(@Body() dto: CreateSemesterDto) {
    return this.termsService.createSemester(dto);
  }

  @Patch('semesters/:id')
  @ApiOperation({ summary: 'Update semester' })
  @RequirePermissions({ resource: PermissionResource.SEMESTER, action: PermissionAction.EDIT })
  @AuditLogAction('UPDATE_SEMESTER', 'SEMESTER')
  async updateSemester(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
    return this.termsService.updateSemester(id, dto);
  }
}
