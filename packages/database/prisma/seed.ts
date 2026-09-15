import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ChuoMS Enterprise Database Seeding...');

  // 1. Clean existing records (reverse dependency order)
  console.log('🧹 Cleaning existing records...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.alumniProfile.deleteMany();
  await prisma.graduationRecord.deleteMany();
  await prisma.clearanceItem.deleteMany();
  await prisma.clearanceRequest.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.financialHold.deleteMany();
  await prisma.feeStructureItem.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.academicProgression.deleteMany();
  await prisma.semesterGrade.deleteMany();
  await prisma.assessmentSubmission.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.room.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.curriculumCourse.deleteMany();
  await prisma.curriculumVersion.deleteMany();
  await prisma.coursePrerequisite.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.studentStatusHistory.deleteMany();
  await prisma.student.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.institution.deleteMany();

  // 2. Institution
  console.log('🏛️ Creating Institution & Campuses...');
  const institution = await prisma.institution.create({
    data: {
      code: 'AITM',
      name: 'Apex Institute of Technology & Management',
      motto: 'Excellence Through Innovation & Integrity',
      website: 'https://aitm.edu',
      primaryEmail: 'info@aitm.edu',
      primaryPhone: '+1-555-0199',
      address: '100 University Boulevard, Tech District',
      defaultCurrency: 'USD',
      defaultTimezone: 'UTC',
    },
  });

  const mainCampus = await prisma.campus.create({
    data: {
      institutionId: institution.id,
      code: 'MAIN',
      name: 'Main Campus - Metropolis',
      address: '100 University Boulevard',
      city: 'Metropolis',
      country: 'United States',
      timezone: 'UTC',
    },
  });

  const northCampus = await prisma.campus.create({
    data: {
      institutionId: institution.id,
      code: 'NORTH',
      name: 'North Campus - Tech Valley',
      address: '450 Innovation Parkway',
      city: 'Tech Valley',
      country: 'United States',
      timezone: 'UTC',
    },
  });

  // 3. Faculties & Departments
  console.log('🏢 Creating Faculties & Departments...');
  const fci = await prisma.faculty.create({
    data: {
      campusId: mainCampus.id,
      code: 'FCI',
      name: 'Faculty of Computing & Informatics',
    },
  });

  const fet = await prisma.faculty.create({
    data: {
      campusId: mainCampus.id,
      code: 'FET',
      name: 'Faculty of Engineering & Technology',
    },
  });

  const fbm = await prisma.faculty.create({
    data: {
      campusId: northCampus.id,
      code: 'FBM',
      name: 'Faculty of Business & Management',
    },
  });

  const csDept = await prisma.department.create({
    data: {
      facultyId: fci.id,
      code: 'CS',
      name: 'Department of Computer Science',
    },
  });

  const seDept = await prisma.department.create({
    data: {
      facultyId: fci.id,
      code: 'SE',
      name: 'Department of Software Engineering',
    },
  });

  const eeDept = await prisma.department.create({
    data: {
      facultyId: fet.id,
      code: 'EE',
      name: 'Department of Electrical Engineering',
    },
  });

  const afDept = await prisma.department.create({
    data: {
      facultyId: fbm.id,
      code: 'AF',
      name: 'Department of Accounting & Finance',
    },
  });

  // 4. Programs
  console.log('🎓 Creating Academic Programs...');
  const bscCs = await prisma.program.create({
    data: {
      departmentId: csDept.id,
      code: 'BCS',
      name: 'Bachelor of Science in Computer Science',
      degreeLevel: 'BACHELOR',
      durationYears: 4,
      totalCreditsRequired: 120,
    },
  });

  const bscSe = await prisma.program.create({
    data: {
      departmentId: seDept.id,
      code: 'BSE',
      name: 'Bachelor of Science in Software Engineering',
      degreeLevel: 'BACHELOR',
      durationYears: 4,
      totalCreditsRequired: 120,
    },
  });

  const bbaAf = await prisma.program.create({
    data: {
      departmentId: afDept.id,
      code: 'BAF',
      name: 'Bachelor of Business Administration in Finance',
      degreeLevel: 'BACHELOR',
      durationYears: 4,
      totalCreditsRequired: 120,
    },
  });

  // 5. System Roles & Granular Permissions
  console.log('🔐 Seeding Roles & Granular Permissions...');
  const rolesList = [
    'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR',
    'ADMISSIONS_OFFICER', 'FINANCE_ADMIN', 'FINANCE_OFFICER', 'ACADEMIC_ADMIN',
    'DEAN', 'HEAD_OF_DEPARTMENT', 'EXAMINATION_OFFICER', 'LECTURER',
    'COORDINATOR', 'LIBRARIAN', 'HOSTEL_WARDEN', 'ICT_ADMIN', 'HR_OFFICER',
    'PROCUREMENT_OFFICER', 'STUDENT_AFFAIRS_OFFICER', 'COUNSELOR',
    'SECURITY_OFFICER', 'PARENT_SPONSOR', 'STUDENT', 'APPLICANT', 'ALUMNI',
    'AUDITOR', 'EXECUTIVE', 'HELPDESK_STAFF',
  ];

  const roleEntities: Record<string, any> = {};
  for (const roleCode of rolesList) {
    roleEntities[roleCode] = await prisma.role.create({
      data: {
        code: roleCode,
        name: roleCode.replace(/_/g, ' '),
        description: `System role for ${roleCode.replace(/_/g, ' ')}`,
        isSystemRole: true,
      },
    });
  }

  // Create granular permissions
  const resources = [
    'CAMPUS', 'FACULTY', 'DEPARTMENT', 'PROGRAM', 'COURSE', 'CURRICULUM',
    'SEMESTER', 'TIMETABLE', 'STUDENT', 'GRADE', 'INVOICE', 'PAYMENT',
    'CLEARANCE', 'AUDIT_LOG', 'USER', 'ROLE',
  ];
  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'PUBLISH'];

  for (const res of resources) {
    for (const act of actions) {
      const perm = await prisma.permission.create({
        data: {
          resource: res,
          action: act,
          description: `Permission to ${act} ${res}`,
        },
      });

      // Grant to Super Admin
      await prisma.rolePermission.create({
        data: {
          roleId: roleEntities['SUPER_ADMIN'].id,
          permissionId: perm.id,
        },
      });

      // Grant VIEW to Registrar, Academic Admin, Lecturer, Student
      if (act === 'VIEW') {
        for (const roleCode of ['REGISTRAR', 'ACADEMIC_ADMIN', 'LECTURER', 'STUDENT']) {
          await prisma.rolePermission.create({
            data: {
              roleId: roleEntities[roleCode].id,
              permissionId: perm.id,
            },
          });
        }
      }

      // Grant CREATE/EDIT/DELETE on Academic & Institutional resources to Registrar and Academic Admin
      if (['CAMPUS', 'FACULTY', 'DEPARTMENT', 'PROGRAM', 'COURSE', 'CURRICULUM', 'SEMESTER'].includes(res)) {
        if (['CREATE', 'EDIT', 'DELETE', 'PUBLISH'].includes(act)) {
          for (const roleCode of ['REGISTRAR', 'ACADEMIC_ADMIN']) {
            await prisma.rolePermission.create({
              data: {
                roleId: roleEntities[roleCode].id,
                permissionId: perm.id,
              },
            });
          }
        }
      }
    }
  }

  // 6. Users & Accounts (Hashed using Argon2id)
  console.log('👥 Creating Demo Accounts with Argon2id Hashes...');
  const defaultPasswordHash = await argon2.hash('Password@2026!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@chuoms.edu',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: roleEntities['SUPER_ADMIN'].id,
      scopeType: 'GLOBAL',
    },
  });

  // Registrar
  const registrarUser = await prisma.user.create({
    data: {
      email: 'registrar@chuoms.edu',
      username: 'registrar',
      staffNumber: 'STF-REG-001',
      firstName: 'Margaret',
      lastName: 'Hamilton',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: registrarUser.id,
      roleId: roleEntities['REGISTRAR'].id,
      scopeType: 'GLOBAL',
    },
  });

  // Finance Officer
  const financeUser = await prisma.user.create({
    data: {
      email: 'finance@chuoms.edu',
      username: 'finance',
      staffNumber: 'STF-FIN-001',
      firstName: 'Marcus',
      lastName: 'Sterling',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: financeUser.id,
      roleId: roleEntities['FINANCE_OFFICER'].id,
      scopeType: 'CAMPUS',
      scopeId: mainCampus.id,
    },
  });

  // Lecturer: Dr. Alan Smith (Computer Science)
  const lecturer1User = await prisma.user.create({
    data: {
      email: 'dr.smith@chuoms.edu',
      username: 'dr.smith',
      staffNumber: 'STF-CS-001',
      firstName: 'Alan',
      lastName: 'Smith',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: lecturer1User.id,
      roleId: roleEntities['LECTURER'].id,
      scopeType: 'DEPARTMENT',
      scopeId: csDept.id,
    },
  });
  const lecturer1Staff = await prisma.staff.create({
    data: {
      userId: lecturer1User.id,
      departmentId: csDept.id,
      staffNumber: 'STF-CS-001',
      employmentType: 'FULL_TIME',
      designation: 'SENIOR_LECTURER',
      highestDegree: 'Ph.D. in Computer Science',
      joinDate: new Date('2020-01-15T00:00:00Z'),
      isTeachingStaff: true,
    },
  });

  // Lecturer: Dr. Grace Hopper (Software Engineering)
  const lecturer2User = await prisma.user.create({
    data: {
      email: 'dr.grace@chuoms.edu',
      username: 'dr.grace',
      staffNumber: 'STF-SE-001',
      firstName: 'Grace',
      lastName: 'Hopper',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: lecturer2User.id,
      roleId: roleEntities['LECTURER'].id,
      scopeType: 'DEPARTMENT',
      scopeId: seDept.id,
    },
  });
  const lecturer2Staff = await prisma.staff.create({
    data: {
      userId: lecturer2User.id,
      departmentId: seDept.id,
      staffNumber: 'STF-SE-001',
      employmentType: 'FULL_TIME',
      designation: 'PROFESSOR',
      highestDegree: 'Ph.D. in Software Systems',
      joinDate: new Date('2018-08-01T00:00:00Z'),
      isTeachingStaff: true,
    },
  });

  // 7. Academic Calendar & Semesters
  console.log('📅 Setting up Academic Calendar...');
  const currentAcademicYear = await prisma.academicYear.create({
    data: {
      name: '2026/2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
    },
  });

  const activeSemester = await prisma.semester.create({
    data: {
      academicYearId: currentAcademicYear.id,
      name: 'Semester 1 (2026/2027)',
      code: '2026-SEM1',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-01-15'),
      registrationStart: new Date('2026-08-15T00:00:00Z'),
      registrationEnd: new Date('2026-09-30T23:59:59Z'),
      isClosed: false,
    },
  });

  // 8. Courses & Prerequisites
  console.log('📚 Building Course Catalogue & Prerequisites...');
  const cs101 = await prisma.course.create({
    data: {
      departmentId: csDept.id,
      code: 'CS101',
      title: 'Introduction to Computer Science & Programming',
      description: 'Foundations of algorithms, procedural programming, and problem solving.',
      creditHours: 3,
      contactHours: 3,
      level: 100,
    },
  });

  const cs201 = await prisma.course.create({
    data: {
      departmentId: csDept.id,
      code: 'CS201',
      title: 'Data Structures and Algorithms',
      description: 'Advanced data structures: trees, graphs, sorting, and asymptotic complexity.',
      creditHours: 4,
      contactHours: 4,
      level: 200,
    },
  });

  // Prerequisite: CS101 is required for CS201
  await prisma.coursePrerequisite.create({
    data: {
      courseId: cs201.id,
      prerequisiteCourseId: cs101.id,
      minGradeRequired: 'C',
      type: 'PREREQUISITE',
    },
  });

  const se201 = await prisma.course.create({
    data: {
      departmentId: seDept.id,
      code: 'SE201',
      title: 'Software Architecture & Design Patterns',
      description: 'Design principles, clean architecture, SOLID patterns, and enterprise modeling.',
      creditHours: 3,
      contactHours: 3,
      level: 200,
    },
  });

  // Prerequisite: CS101 for SE201
  await prisma.coursePrerequisite.create({
    data: {
      courseId: se201.id,
      prerequisiteCourseId: cs101.id,
      minGradeRequired: 'C',
      type: 'PREREQUISITE',
    },
  });

  // 9. Curriculum Versions
  console.log('📜 Defining Versioned Curriculums...');
  const curriculumBcs = await prisma.curriculumVersion.create({
    data: {
      programId: bscCs.id,
      versionName: '2026 BCS Standard Curriculum',
      academicYear: 2026,
    },
  });

  await prisma.curriculumCourse.createMany({
    data: [
      { curriculumVersionId: curriculumBcs.id, courseId: cs101.id, yearOfStudy: 1, semesterNumber: 1, isCore: true },
      { curriculumVersionId: curriculumBcs.id, courseId: cs201.id, yearOfStudy: 2, semesterNumber: 1, isCore: true },
      { curriculumVersionId: curriculumBcs.id, courseId: se201.id, yearOfStudy: 2, semesterNumber: 1, isCore: false },
    ],
  });

  // 10. Physical Infrastructure: Rooms & Timetable
  console.log('🏛️ Allocating Rooms & Scheduling Timetables...');
  const hall101 = await prisma.room.create({
    data: {
      campusId: mainCampus.id,
      building: 'Turing Building',
      roomNumber: '101',
      capacity: 80,
      roomType: 'LECTURE_HALL',
    },
  });

  const lab1 = await prisma.room.create({
    data: {
      campusId: mainCampus.id,
      building: 'Lovelace Center',
      roomNumber: 'LAB-A',
      capacity: 40,
      roomType: 'LAB',
    },
  });

  // Class Sections
  const secCs101 = await prisma.classSection.create({
    data: {
      courseId: cs101.id,
      semesterId: activeSemester.id,
      campusId: mainCampus.id,
      primaryLecturerId: lecturer1Staff.id,
      sectionName: 'Section A - Morning',
      capacity: 60,
      enrolledCount: 2,
    },
  });

  const secCs201 = await prisma.classSection.create({
    data: {
      courseId: cs201.id,
      semesterId: activeSemester.id,
      campusId: mainCampus.id,
      primaryLecturerId: lecturer2Staff.id,
      sectionName: 'Section A - Afternoon',
      capacity: 40,
      enrolledCount: 1,
    },
  });

  // Timetable Slots
  await prisma.timetableSlot.create({
    data: {
      classSectionId: secCs101.id,
      roomId: hall101.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '11:00',
      sessionType: 'LECTURE',
    },
  });

  await prisma.timetableSlot.create({
    data: {
      classSectionId: secCs201.id,
      roomId: lab1.id,
      dayOfWeek: 2, // Tuesday
      startTime: '14:00',
      endTime: '17:00',
      sessionType: 'LAB',
    },
  });

  // 11. Students: Active, Graduated & Applicant
  console.log('🎒 Creating Students & Enrollments...');

  // Student 1: Alice Johnson (Active, BCS)
  const student1User = await prisma.user.create({
    data: {
      email: 'alice.johnson@student.chuoms.edu',
      username: 'alice.johnson',
      admissionNumber: 'ADM-2026-0001',
      firstName: 'Alice',
      lastName: 'Johnson',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: student1User.id,
      roleId: roleEntities['STUDENT'].id,
      scopeType: 'SELF',
    },
  });
  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      campusId: mainCampus.id,
      programId: bscCs.id,
      admissionNumber: 'ADM-2026-0001',
      status: 'ACTIVE',
      cohortYear: 2026,
      currentLevel: 100,
      admissionDate: new Date('2026-09-01T00:00:00Z'),
      advisorId: lecturer1Staff.id,
      gender: 'FEMALE',
      nationality: 'American',
    },
  });

  // Student 2: Bob Miller (Active, BCS)
  const student2User = await prisma.user.create({
    data: {
      email: 'bob.miller@student.chuoms.edu',
      username: 'bob.miller',
      admissionNumber: 'ADM-2026-0002',
      firstName: 'Bob',
      lastName: 'Miller',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: student2User.id,
      roleId: roleEntities['STUDENT'].id,
      scopeType: 'SELF',
    },
  });
  const student2 = await prisma.student.create({
    data: {
      userId: student2User.id,
      campusId: mainCampus.id,
      programId: bscCs.id,
      admissionNumber: 'ADM-2026-0002',
      status: 'ACTIVE',
      cohortYear: 2026,
      currentLevel: 100,
      admissionDate: new Date('2026-09-01T00:00:00Z'),
      advisorId: lecturer1Staff.id,
      gender: 'MALE',
      nationality: 'Canadian',
    },
  });

  // Student 3: Clara Oswald (Graduated / Alumni)
  const student3User = await prisma.user.create({
    data: {
      email: 'clara.oswald@student.chuoms.edu',
      username: 'clara.oswald',
      admissionNumber: 'ADM-2022-0042',
      firstName: 'Clara',
      lastName: 'Oswald',
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: student3User.id,
      roleId: roleEntities['ALUMNI'].id,
      scopeType: 'SELF',
    },
  });
  const student3 = await prisma.student.create({
    data: {
      userId: student3User.id,
      campusId: mainCampus.id,
      programId: bscCs.id,
      admissionNumber: 'ADM-2022-0042',
      status: 'GRADUATED',
      cohortYear: 2022,
      currentLevel: 400,
      admissionDate: new Date('2022-09-01T00:00:00Z'),
      gender: 'FEMALE',
      nationality: 'British',
    },
  });

  // 12. Enrollments & Continuous Assessments
  console.log('📝 Recording Enrollments & Assessment Marks...');
  const enrollAliceCs101 = await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      classSectionId: secCs101.id,
      semesterId: activeSemester.id,
      status: 'ENROLLED',
    },
  });

  const enrollBobCs101 = await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      classSectionId: secCs101.id,
      semesterId: activeSemester.id,
      status: 'ENROLLED',
    },
  });

  // Assessments for CS101
  const cat1 = await prisma.assessment.create({
    data: {
      classSectionId: secCs101.id,
      name: 'Continuous Assessment Test 1 (CAT 1)',
      assessmentType: 'CAT',
      maxMarks: 30,
      weightPercentage: 30,
      dueDate: new Date('2026-10-15T23:59:59Z'),
    },
  });

  const finalExam = await prisma.assessment.create({
    data: {
      classSectionId: secCs101.id,
      name: 'Final Semester Examination',
      assessmentType: 'FINAL_EXAM',
      maxMarks: 70,
      weightPercentage: 70,
      dueDate: new Date('2027-01-10T12:00:00Z'),
    },
  });

  // Submissions
  await prisma.assessmentSubmission.create({
    data: {
      assessmentId: cat1.id,
      studentId: student1.id,
      marksObtained: 28.5,
      gradedBy: lecturer1Staff.id,
      feedback: 'Excellent algorithm implementation.',
    },
  });

  await prisma.assessmentSubmission.create({
    data: {
      assessmentId: finalExam.id,
      studentId: student1.id,
      marksObtained: 63.5,
      gradedBy: lecturer1Staff.id,
      feedback: 'Outstanding comprehensive understanding.',
    },
  });

  // Semester Grade for Alice: Total 92.00 -> Grade A (4.00)
  await prisma.semesterGrade.create({
    data: {
      enrollmentId: enrollAliceCs101.id,
      continuousAssessmentMarks: 28.5,
      examMarks: 63.5,
      totalMarks: 92.0,
      letterGrade: 'A',
      gradePoint: 4.0,
      workflowStatus: 'PUBLISHED',
      submittedBy: lecturer1Staff.id,
      submittedAt: new Date('2027-01-12T10:00:00Z'),
      approvedBy: registrarUser.id,
      approvedAt: new Date('2027-01-13T14:00:00Z'),
      publishedAt: new Date('2027-01-14T09:00:00Z'),
    },
  });

  // Academic Progression Record for Alice
  await prisma.academicProgression.create({
    data: {
      studentId: student1.id,
      semesterId: activeSemester.id,
      creditsAttempted: 3,
      creditsEarned: 3,
      sgpa: 4.0,
      cgpa: 4.0,
      academicStanding: 'GOOD_STANDING',
    },
  });

  // 13. Student Finance: Fee Structures, Invoices, Payments & Receipts
  console.log('💳 Processing Financial Invoicing, Multi-Channel Payments & Receipts...');
  const bscCsFeeStructure = await prisma.feeStructure.create({
    data: {
      programId: bscCs.id,
      campusId: mainCampus.id,
      academicYearId: currentAcademicYear.id,
      semesterId: activeSemester.id,
      name: 'BSc Computer Science - Year 1 Semester 1 Fee Schedule',
      totalAmount: 1800.0,
    },
  });

  const feeTuition = await prisma.feeStructureItem.create({
    data: {
      feeStructureId: bscCsFeeStructure.id,
      category: 'TUITION',
      description: 'Academic Tuition Fee',
      amount: 1400.0,
    },
  });

  const feeLab = await prisma.feeStructureItem.create({
    data: {
      feeStructureId: bscCsFeeStructure.id,
      category: 'LAB_FEE',
      description: 'Computing Laboratories & Cloud Access',
      amount: 300.0,
    },
  });

  const feeMedical = await prisma.feeStructureItem.create({
    data: {
      feeStructureId: bscCsFeeStructure.id,
      category: 'MEDICAL',
      description: 'Student Health & Wellness Clinic',
      amount: 100.0,
    },
  });

  // Invoice for Alice
  const aliceInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-000001',
      studentId: student1.id,
      semesterId: activeSemester.id,
      totalAmount: 1800.0,
      paidAmount: 1800.0,
      balanceAmount: 0.0,
      dueDate: new Date('2026-09-30'),
      status: 'PAID',
    },
  });

  const invItemTuition = await prisma.invoiceItem.create({
    data: {
      invoiceId: aliceInvoice.id,
      category: 'TUITION',
      description: 'Academic Tuition Fee',
      amount: 1400.0,
      paidAmount: 1400.0,
    },
  });

  const invItemLab = await prisma.invoiceItem.create({
    data: {
      invoiceId: aliceInvoice.id,
      category: 'LAB_FEE',
      description: 'Computing Laboratories & Cloud Access',
      amount: 300.0,
      paidAmount: 300.0,
    },
  });

  const invItemMed = await prisma.invoiceItem.create({
    data: {
      invoiceId: aliceInvoice.id,
      category: 'MEDICAL',
      description: 'Student Health & Wellness Clinic',
      amount: 100.0,
      paidAmount: 100.0,
    },
  });

  // Alice Pays via MPESA / Card
  const alicePayment = await prisma.payment.create({
    data: {
      paymentReference: 'PAY-2026-000001',
      studentId: student1.id,
      amount: 1800.0,
      currency: 'USD',
      channel: 'CARD',
      gatewayTransactionId: 'txn_card_99882233',
      gatewayResponse: JSON.stringify({ status: 'succeeded', brand: 'Visa', last4: '4242' }),
      status: 'SUCCESS',
      receiptNumber: 'RCT-2026-000001',
    },
  });

  // Allocations
  await prisma.paymentAllocation.createMany({
    data: [
      { paymentId: alicePayment.id, invoiceItemId: invItemTuition.id, allocatedAmount: 1400.0 },
      { paymentId: alicePayment.id, invoiceItemId: invItemLab.id, allocatedAmount: 300.0 },
      { paymentId: alicePayment.id, invoiceItemId: invItemMed.id, allocatedAmount: 100.0 },
    ],
  });

  // Receipt
  await prisma.receipt.create({
    data: {
      receiptNumber: 'RCT-2026-000001',
      paymentId: alicePayment.id,
      issuedBy: financeUser.id,
      pdfUrl: 'https://storage.aitm.edu/receipts/RCT-2026-000001.pdf',
    },
  });

  // 14. Graduation & Alumni Record (Clara Oswald)
  console.log('🎓 Creating Graduation & Alumni Records...');
  await prisma.graduationRecord.create({
    data: {
      studentId: student3.id,
      certificateNumber: 'AITM-DEG-2026-0042',
      conferralDate: new Date('2026-07-15'),
      honorsClassification: 'FIRST_CLASS',
      finalCgpa: 3.95,
      verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  });

  await prisma.alumniProfile.create({
    data: {
      studentId: student3.id,
      graduationYear: 2026,
      currentEmployer: 'DeepTech Innovations',
      jobTitle: 'Senior Distributed Systems Engineer',
      linkedinUrl: 'https://linkedin.com/in/clara-oswald-demo',
      personalEmail: 'clara.oswald@gmail.com',
    },
  });

  // 15. Initial System Settings & Audit Log
  console.log('⚙️ Writing Initial System Settings & Audit Trails...');
  await prisma.systemSetting.createMany({
    data: [
      { institutionId: institution.id, category: 'GENERAL', key: 'academic_standing_threshold', value: '2.00', description: 'Minimum CGPA for Good Standing' },
      { institutionId: institution.id, category: 'GENERAL', key: 'min_attendance_percentage', value: '75', description: 'Minimum attendance percentage for exam eligibility' },
      { institutionId: institution.id, category: 'FINANCE', key: 'financial_hold_threshold', value: '100.00', description: 'Outstanding balance threshold that triggers registration hold' },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'SYSTEM_INITIALIZED',
      resource: 'Institution',
      resourceId: institution.id,
      newValues: { code: 'AITM', campuses: ['MAIN', 'NORTH'] },
      ipAddress: '127.0.0.1',
      userAgent: 'ChuoMS Database Seeder v1.0',
    },
  });

  console.log('✅ ChuoMS Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
