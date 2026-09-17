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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AdmissionsService } from './admissions.service';
import {
  CreateApplicationDto,
  ScoreApplicationDto,
  AdmissionsDecisionDto,
  AcceptOfferDto,
  MatriculateApplicantDto,
  AttachDocumentDto,
  VerifyDocumentDto,
} from './dto/admissions.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, SystemRole } from '@chuoms/common';

@ApiTags('Admissions & Student Recruitment')
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  // ==========================================
  // PUBLIC APPLICANT WORKFLOWS
  // ==========================================

  @Post('apply')
  @ApiOperation({ summary: 'Submit public applicant application' })
  async apply(@Body() dto: CreateApplicationDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.submitApplication(dto, ipAddress, userAgent);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Public tracking lookup for application status' })
  @ApiQuery({ name: 'applicationNumber', required: true })
  @ApiQuery({ name: 'email', required: true })
  async lookup(
    @Query('applicationNumber') applicationNumber: string,
    @Query('email') email: string,
  ) {
    return this.admissionsService.lookupByApplicationNumber(applicationNumber, email);
  }

  @Get('offer-letter/:idOrAppNumber')
  @ApiOperation({ summary: 'View official offer letter data and verification status' })
  async getOfferLetter(@Param('idOrAppNumber') idOrAppNumber: string) {
    return this.admissionsService.getOfferLetterData(idOrAppNumber);
  }

  @Post('applications/:id/accept-offer')
  @ApiOperation({ summary: 'Accept or decline official admission offer' })
  async acceptOffer(
    @Param('id') id: string,
    @Body() dto: AcceptOfferDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.acceptOffer(id, dto, ipAddress, userAgent);
  }

  // ==========================================
  // ADMISSIONS COMMITTEE & REGISTRAR ACTIONS
  // ==========================================

  @Get('metrics')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'Admissions funnel metrics and key performance indicators' })
  async getMetrics() {
    return this.admissionsService.getMetrics();
  }

  @Get('applications')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'List applicants with filters and pagination' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'programId', required: false })
  @ApiQuery({ name: 'intakeTerm', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listApplications(
    @Query('status') status?: string,
    @Query('programId') programId?: string,
    @Query('intakeTerm') intakeTerm?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admissionsService.listApplications({
      status,
      programId,
      intakeTerm,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('applications/:id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'Get application details by ID' })
  async getApplicationById(@Param('id') id: string) {
    return this.admissionsService.getApplicationById(id);
  }

  @Post('applications/:id/score')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'Score application and update review status' })
  async scoreApplication(
    @Param('id') id: string,
    @Body() dto: ScoreApplicationDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.scoreApplication(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Post('applications/:id/decision')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'Issue formal admissions decision (Offer / Reject)' })
  async issueDecision(
    @Param('id') id: string,
    @Body() dto: AdmissionsDecisionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.issueDecision(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Post('applications/:id/matriculate')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
  )
  @ApiOperation({ summary: 'Matriculate accepted applicant into enrolled student' })
  async matriculate(
    @Param('id') id: string,
    @Body() dto: MatriculateApplicantDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.matriculateApplicant(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Post('applications/:id/documents')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'Attach document to application' })
  async attachDocument(
    @Param('id') id: string,
    @Body() dto: AttachDocumentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.attachDocument(
      id,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }

  @Patch('applications/:id/documents/:docId/verify')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.INSTITUTION_ADMIN,
    SystemRole.REGISTRAR,
    SystemRole.ADMISSIONS_OFFICER,
  )
  @ApiOperation({ summary: 'Verify or unverify application document' })
  async verifyDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: VerifyDocumentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.admissionsService.verifyDocument(
      id,
      docId,
      dto,
      { sub: user.sub, email: user.email },
      ipAddress,
      userAgent,
    );
  }
}
