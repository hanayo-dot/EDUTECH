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
  CreateApplicationDto,
  ScoreApplicationDto,
  AdmissionsDecisionDto,
  AcceptOfferDto,
  MatriculateApplicantDto,
  AttachDocumentDto,
  VerifyDocumentDto,
} from './dto/admissions.dto';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { Decimal } from 'decimal.js';

@Injectable()
export class AdmissionsService {
  private readonly logger = new Logger(AdmissionsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to generate unique sequential application number: APP-YYYY-XXXX
   */
  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.db.applicant.count();
    const sequence = String(count + 1001).padStart(4, '0');
    let appNumber = `APP-${year}-${sequence}`;

    const exists = await this.db.applicant.findUnique({
      where: { applicationNumber: appNumber },
    });

    if (exists) {
      const suffix = randomBytes(2).toString('hex').toUpperCase();
      appNumber = `APP-${year}-${sequence}-${suffix}`;
    }

    return appNumber;
  }

  /**
   * Helper to generate institutional admission number: ADM-YYYY-XXXX
   */
  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.db.student.count();
    const sequence = String(count + 1).padStart(4, '0');
    let admNumber = `ADM-${year}-${sequence}`;

    const exists = await this.db.student.findUnique({
      where: { admissionNumber: admNumber },
    });

    if (exists) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      admNumber = `ADM-${year}-${randomPart}`;
    }

    return admNumber;
  }

  /**
   * 1. Public Self-Service Application Submission
   */
  async submitApplication(dto: CreateApplicationDto, ipAddress = '127.0.0.1', userAgent = 'Unknown') {
    // 1. Verify program exists and is active
    const program = await this.db.program.findUnique({
      where: { id: dto.programId },
      include: { department: { include: { faculty: true } } },
    });

    if (!program || !program.isActive) {
      throw new NotFoundException({
        code: 'PROGRAM_NOT_FOUND',
        message: 'The selected academic program does not exist or is currently inactive.',
      });
    }

    // 2. Check or create User account for applicant
    let user = await this.db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { applicantProfile: true, studentProfile: true },
    });

    if (user?.applicantProfile) {
      throw new ConflictException({
        code: 'APPLICATION_ALREADY_EXISTS',
        message: `An active application (${user.applicantProfile.applicationNumber}) already exists for email: ${dto.email}`,
      });
    }

    if (user?.studentProfile) {
      throw new ConflictException({
        code: 'ALREADY_MATRICULATED_STUDENT',
        message: 'This email is already associated with an active enrolled student.',
      });
    }

    if (dto.phone) {
      const phoneUser = await this.db.user.findFirst({
        where: { phone: dto.phone },
      });
      if (phoneUser && phoneUser.id !== user?.id) {
        throw new ConflictException({
          code: 'PHONE_ALREADY_EXISTS',
          message: `The phone number ${dto.phone} is already registered to another user.`,
        });
      }
    }

    // Fetch APPLICANT role
    const applicantRole = await this.db.role.findUnique({
      where: { code: 'APPLICANT' },
    });

    const defaultPassword = 'Applicant@2026!';
    const passwordHash = await argon2.hash(defaultPassword, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const applicationNumber = await this.generateApplicationNumber();

    // Execute atomic transaction for user creation and applicant profile
    const result = await this.db.$transaction(async (tx) => {
      let effectiveUserId: string;
      let effectiveEmail = dto.email.toLowerCase();
      let effectivePhone = dto.phone || null;

      if (!user) {
        const username = `${dto.firstName.toLowerCase()}.${dto.lastName.toLowerCase()}.${randomBytes(2).toString('hex')}`;
        const createdUser = await tx.user.create({
          data: {
            email: effectiveEmail,
            username,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName || null,
            phone: effectivePhone,
            passwordHash,
            isActive: true,
          },
        });

        effectiveUserId = createdUser.id;

        if (applicantRole) {
          await tx.userRole.create({
            data: {
              userId: effectiveUserId,
              roleId: applicantRole.id,
              scopeType: 'SELF',
            },
          });
        }
      } else {
        effectiveUserId = user.id;
        effectiveEmail = user.email;
        effectivePhone = user.phone;
      }

      // Create Applicant record
      const applicant = await tx.applicant.create({
        data: {
          userId: effectiveUserId,
          programId: dto.programId,
          applicationNumber,
          status: 'SUBMITTED',
          intakeTerm: dto.intakeTerm,
        },
      });

      // Attach documents if provided
      if (dto.documents && dto.documents.length > 0) {
        await tx.applicationDocument.createMany({
          data: dto.documents.map((doc) => ({
            applicantId: applicant.id,
            docType: doc.docType,
            title: doc.title,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 1024,
            mimeType: doc.mimeType || 'application/pdf',
            isVerified: false,
          })),
        });
      }

      return {
        applicant,
        userId: effectiveUserId,
        email: effectiveEmail,
        phone: effectivePhone,
      };
    });

    // Audit log
    await this.auditService.log({
      userId: result.userId,
      userEmail: result.email,
      action: 'APPLICANT_SUBMITTED',
      resource: 'APPLICANT',
      resourceId: result.applicant.id,
      newValues: {
        applicationNumber: result.applicant.applicationNumber,
        programCode: program.code,
        intakeTerm: dto.intakeTerm,
      },
      ipAddress,
      userAgent,
      reason: 'Public online application submission',
    });

    return {
      id: result.applicant.id,
      applicationNumber: result.applicant.applicationNumber,
      status: result.applicant.status,
      intakeTerm: result.applicant.intakeTerm,
      program: {
        id: program.id,
        code: program.code,
        name: program.name,
        faculty: program.department.faculty.name,
      },
      applicant: {
        fullName: `${dto.firstName} ${dto.lastName}`,
        email: result.email,
        phone: result.phone,
      },
      documentsCount: dto.documents?.length || 0,
      createdAt: result.applicant.createdAt,
      portalAccess: {
        note: 'You can track your application status using your Application Number and Email.',
        applicationNumber: result.applicant.applicationNumber,
      },
    };
  }

  /**
   * 2. List Applications for Admissions Officers with Filters & Pagination
   */
  async listApplications(params: {
    status?: string;
    programId?: string;
    intakeTerm?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.programId) where.programId = params.programId;
    if (params.intakeTerm) where.intakeTerm = params.intakeTerm;

    if (params.search) {
      where.OR = [
        { applicationNumber: { contains: params.search, mode: 'insensitive' } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [total, applicants] = await Promise.all([
      this.db.applicant.count({ where }),
      this.db.applicant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              email: true,
              phone: true,
            },
          },
          program: {
            select: {
              id: true,
              code: true,
              name: true,
              degreeLevel: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  faculty: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              docType: true,
              title: true,
              fileUrl: true,
              isVerified: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: applicants.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        status: app.status,
        intakeTerm: app.intakeTerm,
        score: app.score ? Number(app.score) : null,
        decisionDate: app.decisionDate,
        decisionReason: app.decisionReason,
        offerLetterUrl: app.offerLetterUrl,
        createdAt: app.createdAt,
        user: app.user,
        program: app.program,
        documents: app.documents,
      })),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * 3. Get Application by ID
   */
  async getApplicationById(id: string) {
    const applicant = await this.db.applicant.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        program: {
          include: {
            department: {
              include: {
                faculty: {
                  include: {
                    campus: true,
                  },
                },
              },
            },
          },
        },
        documents: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException({
        code: 'APPLICANT_NOT_FOUND',
        message: `Applicant record with ID ${id} not found.`,
      });
    }

    return {
      ...applicant,
      score: applicant.score ? Number(applicant.score) : null,
    };
  }

  /**
   * 4. Public Lookup by Application Number and Email
   */
  async lookupByApplicationNumber(applicationNumber: string, email: string) {
    const applicant = await this.db.applicant.findFirst({
      where: {
        applicationNumber: applicationNumber.trim(),
        user: {
          email: email.trim().toLowerCase(),
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        program: {
          select: {
            code: true,
            name: true,
            degreeLevel: true,
            department: {
              select: {
                name: true,
                faculty: {
                  select: {
                    name: true,
                    campus: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            docType: true,
            title: true,
            isVerified: true,
          },
        },
      },
    });

    if (!applicant) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: 'No matching application found with the provided Application Number and Email combination.',
      });
    }

    return {
      id: applicant.id,
      applicationNumber: applicant.applicationNumber,
      status: applicant.status,
      intakeTerm: applicant.intakeTerm,
      score: applicant.score ? Number(applicant.score) : null,
      decisionDate: applicant.decisionDate,
      decisionReason: applicant.decisionReason,
      offerLetterUrl: applicant.offerLetterUrl,
      applicantName: `${applicant.user?.firstName} ${applicant.user?.lastName}`,
      email: applicant.user?.email,
      program: applicant.program,
      documents: applicant.documents,
      createdAt: applicant.createdAt,
    };
  }

  /**
   * 5. Admissions Committee Scoring
   */
  async scoreApplication(
    id: string,
    dto: ScoreApplicationDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const applicant = await this.db.applicant.findUnique({
      where: { id },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant ${id} not found.`);
    }

    if (applicant.status === 'MATRICULATED') {
      throw new BadRequestException('Cannot score an already matriculated student.');
    }

    const nextStatus = dto.status || (dto.score >= 65 ? 'SHORTLISTED' : 'UNDER_REVIEW');

    const updated = await this.db.applicant.update({
      where: { id },
      data: {
        score: new Decimal(dto.score),
        status: nextStatus,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        program: { select: { code: true, name: true } },
      },
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'APPLICANT_SCORED',
      resource: 'APPLICANT',
      resourceId: id,
      oldValues: { score: applicant.score ? Number(applicant.score) : null, status: applicant.status },
      newValues: { score: dto.score, status: nextStatus, notes: dto.notes },
      ipAddress,
      userAgent,
      reason: dto.notes || 'Admissions committee evaluation scoring',
    });

    return {
      id: updated.id,
      applicationNumber: updated.applicationNumber,
      score: Number(updated.score),
      status: updated.status,
      notes: dto.notes,
    };
  }

  /**
   * 6. Issue Formal Admissions Decision (OFFERED or REJECTED)
   */
  async issueDecision(
    id: string,
    dto: AdmissionsDecisionDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const applicant = await this.db.applicant.findUnique({
      where: { id },
      include: {
        user: true,
        program: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant ${id} not found.`);
    }

    if (applicant.status === 'MATRICULATED') {
      throw new BadRequestException('Applicant is already matriculated.');
    }

    // Generate tamper-evident verification hash for offer letter
    const verificationPayload = `${applicant.applicationNumber}:${applicant.program.code}:${new Date().toISOString()}`;
    const verificationHash = createHash('sha256').update(verificationPayload).digest('hex').substring(0, 16).toUpperCase();
    const offerLetterUrl =
      dto.decision === 'OFFERED'
        ? `/admissions/offer-letter?app=${applicant.applicationNumber}&verify=${verificationHash}`
        : null;

    const updated = await this.db.applicant.update({
      where: { id },
      data: {
        status: dto.decision,
        decisionDate: new Date(),
        decisionReason: dto.decisionReason || (dto.decision === 'OFFERED' ? 'Meets all institutional academic requirements' : 'Does not meet minimum requirements'),
        offerLetterUrl,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        program: { select: { code: true, name: true } },
      },
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: dto.decision === 'OFFERED' ? 'OFFER_ISSUED' : 'APPLICATION_REJECTED',
      resource: 'APPLICANT',
      resourceId: id,
      oldValues: { status: applicant.status },
      newValues: {
        status: updated.status,
        decisionReason: updated.decisionReason,
        offerLetterUrl,
      },
      ipAddress,
      userAgent,
      reason: dto.decisionReason || `Admissions decision: ${dto.decision}`,
    });

    return {
      id: updated.id,
      applicationNumber: updated.applicationNumber,
      status: updated.status,
      decisionDate: updated.decisionDate,
      decisionReason: updated.decisionReason,
      offerLetterUrl: updated.offerLetterUrl,
      verificationHash,
    };
  }

  /**
   * 7. Applicant Accepts or Declines Offer
   */
  async acceptOffer(
    id: string,
    dto: AcceptOfferDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const applicant = await this.db.applicant.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant ${id} not found.`);
    }

    if (applicant.status !== 'OFFERED') {
      throw new BadRequestException(`Application is in '${applicant.status}' state. Only OFFERED applications can be accepted.`);
    }

    const newStatus = dto.accepted ? 'ACCEPTED' : 'REJECTED';
    const reason = dto.accepted
      ? dto.notes || 'Offer accepted by applicant.'
      : dto.notes || 'Offer formally declined by applicant.';

    const updated = await this.db.applicant.update({
      where: { id },
      data: {
        status: newStatus,
        decisionReason: reason,
      },
    });

    await this.auditService.log({
      userId: applicant.userId || undefined,
      userEmail: applicant.user?.email || undefined,
      action: dto.accepted ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED',
      resource: 'APPLICANT',
      resourceId: id,
      oldValues: { status: applicant.status },
      newValues: { status: updated.status, reason },
      ipAddress,
      userAgent,
      reason,
    });

    return {
      id: updated.id,
      applicationNumber: updated.applicationNumber,
      status: updated.status,
      message: dto.accepted
        ? 'Congratulations! Your acceptance has been recorded. The admissions office will now proceed with final matriculation.'
        : 'Your decision to decline the offer has been recorded.',
    };
  }

  /**
   * 8. Matriculation Engine: Converts Accepted Applicant to Enrolled Student
   */
  async matriculateApplicant(
    id: string,
    dto: MatriculateApplicantDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const applicant = await this.db.applicant.findUnique({
      where: { id },
      include: {
        user: true,
        program: {
          include: {
            department: {
              include: {
                faculty: {
                  include: {
                    campus: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant ${id} not found.`);
    }

    if (applicant.status === 'MATRICULATED') {
      throw new BadRequestException('Applicant has already been matriculated into a student record.');
    }

    if (!['ACCEPTED', 'OFFERED'].includes(applicant.status)) {
      throw new BadRequestException(`Applicant status is '${applicant.status}'. Must be in 'ACCEPTED' or 'OFFERED' state to matriculate.`);
    }

    // Determine target campus
    let campusId = dto.campusId;
    if (!campusId) {
      campusId = applicant.program.department.faculty.campusId;
      if (!campusId) {
        const defaultCampus = await this.db.campus.findFirst({ where: { code: 'MAIN' } });
        campusId = defaultCampus?.id || (await this.db.campus.findFirst())?.id;
      }
    }

    if (!campusId) {
      throw new BadRequestException('No campus could be resolved for matriculation.');
    }

    const studentRole = await this.db.role.findUnique({
      where: { code: 'STUDENT' },
    });

    const admissionNumber = await this.generateAdmissionNumber();
    const cohortYear = dto.cohortYear || new Date().getFullYear();
    const currentLevel = dto.currentLevel || 100;
    const studyMode = dto.studyMode || 'REGULAR';

    // Execute atomic transaction
    const matriculationResult = await this.db.$transaction(async (tx) => {
      // 1. Ensure User exists and has admissionNumber
      let userId = applicant.userId;
      if (!userId) {
        const passwordHash = await argon2.hash('Student@2026!', {
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
        const newUser = await tx.user.create({
          data: {
            email: `student.${admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.chuoms.edu`,
            username: admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, ''),
            admissionNumber,
            passwordHash,
            firstName: 'Admitted',
            lastName: 'Student',
            isActive: true,
          },
        });
        userId = newUser.id;
      } else {
        await tx.user.update({
          where: { id: userId },
          data: {
            admissionNumber,
          },
        });
      }

      // 2. Assign STUDENT role in user_roles
      if (studentRole) {
        const existingRole = await tx.userRole.findFirst({
          where: { userId, roleId: studentRole.id },
        });
        if (!existingRole) {
          await tx.userRole.create({
            data: {
              userId,
              roleId: studentRole.id,
              scopeType: 'SELF',
            },
          });
        }
      }

      // 3. Create Student record
      const student = await tx.student.create({
        data: {
          userId,
          campusId,
          programId: applicant.programId,
          admissionNumber,
          status: 'ACTIVE',
          cohortYear,
          currentLevel,
          studyMode,
          admissionDate: new Date(),
        },
      });

      // 4. Create Student Status History
      await tx.studentStatusHistory.create({
        data: {
          studentId: student.id,
          fromStatus: 'APPLICANT',
          toStatus: 'ACTIVE',
          reason: dto.notes || 'Matriculation upon successful admissions verification',
          changedBy: officer.sub,
        },
      });

      // 5. Update Applicant status to MATRICULATED
      await tx.applicant.update({
        where: { id: applicant.id },
        data: {
          status: 'MATRICULATED',
        },
      });

      // 6. Check for active semester to optionally initialize tuition invoice
      const activeSemester = await tx.semester.findFirst({
        where: { isClosed: false },
        orderBy: { startDate: 'desc' },
      });

      let generatedInvoiceNumber: string | null = null;
      if (activeSemester) {
        const invCount = await tx.invoice.count();
        generatedInvoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;
        
        // Initial matriculation invoice: Tuition $1,500, Registration $100, Student ID $25, Library $75
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: generatedInvoiceNumber,
            studentId: student.id,
            semesterId: activeSemester.id,
            totalAmount: new Decimal(1700.0),
            balanceAmount: new Decimal(1700.0),
            paidAmount: new Decimal(0),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'ISSUED',
          },
        });

        await tx.invoiceItem.createMany({
          data: [
            {
              invoiceId: invoice.id,
              category: 'TUITION',
              description: `Tuition Fee - Level ${currentLevel} Semester 1`,
              amount: new Decimal(1500.0),
            },
            {
              invoiceId: invoice.id,
              category: 'REGISTRATION',
              description: 'First Year Matriculation & Registration Fee',
              amount: new Decimal(100.0),
            },
            {
              invoiceId: invoice.id,
              category: 'STUDENT_ID',
              description: 'Smart RFID Student ID Card Issuance',
              amount: new Decimal(25.0),
            },
            {
              invoiceId: invoice.id,
              category: 'LIBRARY',
              description: 'Academic Library & Digital Journal Subscription',
              amount: new Decimal(75.0),
            },
          ],
        });
      }

      return { student, admissionNumber, invoiceNumber: generatedInvoiceNumber };
    });

    // Audit log
    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: 'APPLICANT_MATRICULATED',
      resource: 'STUDENT',
      resourceId: matriculationResult.student.id,
      newValues: {
        applicantId: id,
        admissionNumber: matriculationResult.admissionNumber,
        programCode: applicant.program.code,
        campusId,
        invoiceNumber: matriculationResult.invoiceNumber,
      },
      ipAddress,
      userAgent,
      reason: dto.notes || 'Full applicant matriculation to active student',
    });

    return {
      success: true,
      studentId: matriculationResult.student.id,
      admissionNumber: matriculationResult.admissionNumber,
      status: 'ACTIVE',
      program: {
        code: applicant.program.code,
        name: applicant.program.name,
      },
      cohortYear,
      currentLevel,
      studyMode,
      initialInvoiceNumber: matriculationResult.invoiceNumber,
      message: `Applicant successfully matriculated. Assigned official admission number: ${matriculationResult.admissionNumber}`,
    };
  }

  /**
   * 9. Admissions Metrics & Analytics Summary
   */
  async getMetrics() {
    const [
      total,
      submitted,
      underReview,
      shortlisted,
      offered,
      accepted,
      matriculated,
      rejected,
      documentsCount,
    ] = await Promise.all([
      this.db.applicant.count(),
      this.db.applicant.count({ where: { status: 'SUBMITTED' } }),
      this.db.applicant.count({ where: { status: 'UNDER_REVIEW' } }),
      this.db.applicant.count({ where: { status: 'SHORTLISTED' } }),
      this.db.applicant.count({ where: { status: 'OFFERED' } }),
      this.db.applicant.count({ where: { status: 'ACCEPTED' } }),
      this.db.applicant.count({ where: { status: 'MATRICULATED' } }),
      this.db.applicant.count({ where: { status: 'REJECTED' } }),
      this.db.applicationDocument.count(),
    ]);

    return {
      totalApplications: total,
      submitted,
      underReview,
      shortlisted,
      offered,
      accepted,
      matriculated,
      rejected,
      totalDocumentsUploaded: documentsCount,
      acceptanceRatePercent: total > 0 ? Math.round(((offered + accepted + matriculated) / total) * 100) : 0,
      matriculationRatePercent: offered + accepted + matriculated > 0
        ? Math.round((matriculated / (offered + accepted + matriculated)) * 100)
        : 0,
    };
  }

  /**
   * 10. Document Attachment
   */
  async attachDocument(
    applicantId: string,
    dto: AttachDocumentDto,
    officer?: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const applicant = await this.db.applicant.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant ${applicantId} not found.`);
    }

    const doc = await this.db.applicationDocument.create({
      data: {
        applicantId,
        docType: dto.docType,
        title: dto.title,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize || 1024,
        mimeType: dto.mimeType || 'application/pdf',
        isVerified: false,
      },
    });

    if (officer) {
      await this.auditService.log({
        userId: officer.sub,
        userEmail: officer.email,
        action: 'DOCUMENT_ATTACHED',
        resource: 'APPLICATION_DOCUMENT',
        resourceId: doc.id,
        newValues: { docType: doc.docType, title: doc.title },
        ipAddress,
        userAgent,
        reason: 'Document attached to applicant file',
      });
    }

    return doc;
  }

  /**
   * 11. Document Verification
   */
  async verifyDocument(
    applicantId: string,
    docId: string,
    dto: VerifyDocumentDto,
    officer: { sub: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const doc = await this.db.applicationDocument.findFirst({
      where: { id: docId, applicantId },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${docId} for applicant ${applicantId} not found.`);
    }

    const updated = await this.db.applicationDocument.update({
      where: { id: docId },
      data: {
        isVerified: dto.isVerified,
      },
    });

    await this.auditService.log({
      userId: officer.sub,
      userEmail: officer.email,
      action: dto.isVerified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_UNVERIFIED',
      resource: 'APPLICATION_DOCUMENT',
      resourceId: docId,
      oldValues: { isVerified: doc.isVerified },
      newValues: { isVerified: dto.isVerified, notes: dto.notes },
      ipAddress,
      userAgent,
      reason: dto.notes || 'Document verification by admissions officer',
    });

    return updated;
  }

  /**
   * 12. Generate Official Offer Letter Data
   */
  async getOfferLetterData(idOrAppNumber: string) {
    const applicant = await this.db.applicant.findFirst({
      where: {
        OR: [
          { id: idOrAppNumber },
          { applicationNumber: idOrAppNumber },
        ],
      },
      include: {
        user: true,
        program: {
          include: {
            department: {
              include: {
                faculty: {
                  include: {
                    campus: {
                      include: {
                        institution: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!applicant) {
      throw new NotFoundException('Applicant not found.');
    }

    if (!['OFFERED', 'ACCEPTED', 'MATRICULATED'].includes(applicant.status)) {
      throw new BadRequestException('Admission offer has not been issued for this application.');
    }

    const faculty = applicant.program.department.faculty;
    const campus = faculty.campus;
    const institution = campus.institution;

    return {
      institutionName: institution.name,
      institutionCode: institution.code,
      campusName: campus.name,
      campusLocation: `${campus.city || 'Metropolis'}, ${campus.country || 'USA'}`,
      applicantName: `${applicant.user?.firstName} ${applicant.user?.lastName}`,
      applicantEmail: applicant.user?.email,
      applicationNumber: applicant.applicationNumber,
      programCode: applicant.program.code,
      programName: applicant.program.name,
      facultyName: faculty.name,
      degreeLevel: applicant.program.degreeLevel,
      durationYears: applicant.program.durationYears,
      intakeTerm: applicant.intakeTerm,
      decisionDate: applicant.decisionDate || applicant.updatedAt,
      reportingDate: '2026-09-01T09:00:00Z',
      conditions: applicant.decisionReason || 'Admission is contingent on presentation of original academic certificates during orientation.',
      verificationCode: createHash('sha256')
        .update(`${applicant.applicationNumber}:${applicant.program.code}`)
        .digest('hex')
        .substring(0, 12)
        .toUpperCase(),
      status: applicant.status,
    };
  }
}
