import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- Verifying Database Integrity & Seeded Entities ---');

  const institutions = await prisma.institution.count();
  const campuses = await prisma.campus.count();
  const faculties = await prisma.faculty.count();
  const departments = await prisma.department.count();
  const programs = await prisma.program.count();
  const roles = await prisma.role.count();
  const permissions = await prisma.permission.count();
  const users = await prisma.user.count();
  const staff = await prisma.staff.count();
  const students = await prisma.student.count();
  const courses = await prisma.course.count();
  const prerequisites = await prisma.coursePrerequisite.count();
  const enrollments = await prisma.enrollment.count();
  const grades = await prisma.semesterGrade.count();
  const invoices = await prisma.invoice.count();
  const payments = await prisma.payment.count();
  const receipts = await prisma.receipt.count();
  const graduationRecords = await prisma.graduationRecord.count();
  const alumniProfiles = await prisma.alumniProfile.count();
  const auditLogs = await prisma.auditLog.count();

  console.log(`Institutions: ${institutions}`);
  console.log(`Campuses: ${campuses}`);
  console.log(`Faculties: ${faculties}`);
  console.log(`Departments: ${departments}`);
  console.log(`Programs: ${programs}`);
  console.log(`Roles: ${roles}`);
  console.log(`Permissions: ${permissions}`);
  console.log(`Users: ${users}`);
  console.log(`Staff: ${staff}`);
  console.log(`Students: ${students}`);
  console.log(`Courses: ${courses}`);
  console.log(`Prerequisites: ${prerequisites}`);
  console.log(`Enrollments: ${enrollments}`);
  console.log(`Published Grades: ${grades}`);
  console.log(`Invoices: ${invoices}`);
  console.log(`Payments: ${payments}`);
  console.log(`Receipts: ${receipts}`);
  console.log(`Graduation Records: ${graduationRecords}`);
  console.log(`Alumni Profiles: ${alumniProfiles}`);
  console.log(`Audit Logs: ${auditLogs}`);

  if (institutions !== 1 || campuses !== 2 || roles < 28 || users < 6 || students < 3 || payments < 1) {
    throw new Error('Database verification check failed: missing expected entity counts.');
  }

  // Verify relational query: student -> invoice -> payment -> receipt
  const alice = await prisma.student.findUniqueOrThrow({
    where: { admissionNumber: 'ADM-2026-0001' },
    include: {
      user: true,
      program: true,
      invoices: { include: { items: true } },
      payments: { include: { receipt: true, allocations: true } },
      enrollments: { include: { classSection: { include: { course: true } }, semesterGrade: true } },
      progressions: true,
    },
  });

  console.log(`✔ Verified Student 360 Graph: ${alice.user.firstName} ${alice.user.lastName} (${alice.admissionNumber})`);
  console.log(`  - Program: ${alice.program.name}`);
  console.log(`  - Enrolled courses: ${alice.enrollments.map((e) => e.classSection.course.code).join(', ')}`);
  console.log(`  - SGPA: ${alice.progressions[0].sgpa.toString()}, Standing: ${alice.progressions[0].academicStanding}`);
  console.log(`  - Invoice: ${alice.invoices[0].invoiceNumber}, Total: $${alice.invoices[0].totalAmount.toString()}, Paid: $${alice.invoices[0].paidAmount.toString()}`);
  console.log(`  - Payment Ref: ${alice.payments[0].paymentReference}, Receipt: ${alice.payments[0].receipt?.receiptNumber}`);

  console.log('--- Database Integrity Verification: 100% PASSED ---');
}

verify()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
