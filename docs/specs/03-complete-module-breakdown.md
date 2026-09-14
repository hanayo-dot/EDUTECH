# Complete Module Breakdown
## Enterprise College Management System Subsystems

The system is engineered into 20 cohesive, loosely-coupled modules sharing a unified core domain model and transactional relational database.

---

### Module 01: Core Identity, Authentication & Granular RBAC
- **Purpose**: Centralized authentication, multi-identifier credentials, multi-factor authentication, device/session controls, and scope-based authorization.
- **Key Capabilities**:
  - Argon2id password hashing with salt, pepper, and memory-cost configuration.
  - Multi-identifier authentication: email, username, student admission number, staff number.
  - TOTP MFA (RFC 6238) with single-use cryptographic recovery tokens.
  - Device session tracking with active session revocation (per-device or all-devices logout).
  - Granular RBAC supporting dynamic role creation, cloning, 13 action verbs, and hierarchical scope constraints (Global, Campus, Faculty, Department, Program, Cohort, Self).

### Module 02: Institutional Organization & Multi-Campus Hierarchy
- **Purpose**: Defines institutional structural topology and configuration variables.
- **Key Capabilities**:
  - Configurable hierarchy: `Institution` → `Campus` → `Faculty/School` → `Department` → `Program` → `Cohort/Class`.
  - Campus-specific configurations: timezone, calendar, currency, contact info, localized policies.
  - Support for multi-site physical infrastructure (campuses, buildings, lecture halls, laboratories).

### Module 03: Admissions & Applicant Lifecycle
- **Purpose**: Self-service application submission, processing, assessment, and matriculation.
- **Key Capabilities**:
  - Intake cycles and application batches with customizable opening/closing windows.
  - Multi-program application preferences (1st, 2nd, and 3rd choice).
  - Document upload pipeline (prior academic transcripts, identification, passport photos).
  - Automated application fee invoicing and online payment settlement.
  - Committee review scoring, eligibility checks, interview management, and admission letter generation.
  - Seamless applicant-to-student matriculation pipeline generating admission numbers and student accounts without data re-entry.

### Module 04: Student Information Management (SIS)
- **Purpose**: Comprehensive student lifecycle record management from admission to alumni.
- **Key Capabilities**:
  - 360-degree student profile: personal, biographical, nationality, contact, emergency, guardian/sponsor details.
  - Configurable student lifecycle statuses: `Applicant`, `Admitted`, `Active`, `Deferred`, `Suspended`, `On Leave`, `Withdrawn`, `Discontinued`, `Completed`, `Graduated`, `Alumni`.
  - Immutable status change audit log with mandatory justification and authorization metadata.
  - Academic advising assignments and student advisor tracking.

### Module 05: Academic Structure & Curriculum Management
- **Purpose**: Setup of academic years, terms, study levels, courses, and versioned curricula.
- **Key Capabilities**:
  - Flexible terms: Semesters, trimesters, quarters, and accelerated summer terms.
  - Course catalogue: Course codes, titles, credit hours, contact hours, prerequisites, co-requisites.
  - Curriculum builder: Definable by program, academic level, and curriculum version/cohort.
  - Degree audit engine: Verifies student progress against core credits, elective credits, and graduation thresholds without mutating historical curriculums.

### Module 06: Course Registration & Enrollment Engine
- **Purpose**: Manages student course registration windows, prerequisite validation, and capacity control.
- **Key Capabilities**:
  - Registration periods with add/drop and late registration fee rules.
  - Real-time server-side prerequisite and co-requisite checks.
  - Credit limit checks (minimum and maximum allowed credits per semester).
  - Financial and academic hold enforcement (blocks registration if hold is active).
  - High-concurrency room and class capacity locking to prevent over-enrollment.

### Module 07: Timetable & Resource Allocation
- **Purpose**: Conflict-free scheduling of classes, practicals, tutorials, and examinations.
- **Key Capabilities**:
  - Multi-dimensional clash detection: Lecturer conflicts, room conflicts, student cohort conflicts.
  - Multi-format timetable generation: Student timetable, Lecturer timetable, Room timetable, Campus timetable.
  - Timetable publication workflow with revision history and student notification triggers.

### Module 08: Attendance Tracking
- **Purpose**: Lecture, laboratory, and institutional event attendance tracking.
- **Key Capabilities**:
  - Lecturer attendance marking interface (Present, Absent, Late, Excused).
  - Dynamic, time-decaying QR codes for student self-check-in with optional geolocation radius verification.
  - Automated attendance percentage calculation against institutional minimum attendance thresholds (e.g., 75% rule for exam eligibility).
  - Automated alerts to students and academic advisors when thresholds are breached.

### Module 09: Assessments, Gradebook & Academic Progression
- **Purpose**: Continuous assessments, examinations, grade entry, moderation, GPA, and progression.
- **Key Capabilities**:
  - Configurable assessment weightings (e.g., CATs, assignments, lab work, final examinations).
  - Secure class gradebook: Lecturers can only enter grades for assigned course sections.
  - Grade approval workflow: `Draft` → `Submitted` → `Moderated` → `Approved` → `Published`.
  - Configurable grading scales (Letter grades, percentage intervals, GPA points).
  - Automated calculation of Semester GPA (SGPA) and Cumulative GPA (CGPA).
  - Configurable academic standing engine: Good Standing, Academic Warning, Probation, Suspension, or Academic Discontinuation.

### Module 10: Student Finance, Billing & Invoicing
- **Purpose**: Multi-tier fee structures, invoicing, adjustments, and financial tracking.
- **Key Capabilities**:
  - Flexible fee structure builder (by program, campus, academic year, semester, student residency category).
  - Automatic invoice generation upon semester registration.
  - Debit/credit notes, fee adjustments, waivers, discounts, and bursaries.
  - Detailed student ledger statements and aging receivables reporting.

### Module 11: Multi-Channel Payments & Financial Reconciliation
- **Purpose**: Multi-provider payment gateway integration, transaction verification, and receipting.
- **Key Capabilities**:
  - Multi-channel payment adapters: Bank transfer, Card gateways, Mobile Money (e.g., M-Pesa), Cash desk.
  - Idempotent webhook processing and server-to-server transaction verification to prevent duplicate credits.
  - Strict FIFO or user-selected invoice item payment allocation.
  - Instant generation of tamper-proof, numbered official receipts.
  - Daily cashier closing logs, reconciliation reports, and payment reversal/refund multi-stage approvals.

### Module 12: Transcripts, Certificates & Public Verification
- **Purpose**: Official academic credential generation and third-party verification.
- **Key Capabilities**:
  - Official and unofficial transcript generation in tamper-resistant PDF format.
  - High-security completion certificates with unique cryptographic verification codes and QR codes.
  - Public verification portal: Privacy-safe validation confirming awardee name, program, and completion year without leaking private PII or full grade transcripts.

### Module 13: Library Management Integration
- **Purpose**: Library resource catalogue, circulation tracking, and clearance sign-off.
- **Key Capabilities**:
  - Catalogue: Books, journals, digital resources, ISBN, copies, physical locations.
  - Borrowing, return, renewal, and automated fine calculation for overdue items.
  - Library clearance check integration preventing graduation or transfer if unreturned books or fines exist.
  - Pluggable API adapters for external LMS/ILS (e.g., Koha).

### Module 14: Hostel & Accommodation Management
- **Purpose**: Campus housing, room allocation, occupancy management, and maintenance.
- **Key Capabilities**:
  - Hostel building, floor, room, and bed inventory management.
  - Student online room application and automated/manual allocation.
  - Check-in and check-out condition inspection recording.
  - Hostel fee auto-invoicing and clearance sign-off integration.

### Module 15: Staff, HR & Academic Workload
- **Purpose**: Staff directory, contracts, qualifications, and faculty teaching workload tracking.
- **Key Capabilities**:
  - Comprehensive staff profile (academic and non-teaching personnel).
  - Course allocation tracking: Credit hours, contact hours, student counts.
  - Teaching workload calculation and policy compliance (underload / overload reporting).
  - Leave management and departmental assignment tracking.

### Module 16: Student Services, Helpdesk & Clearance
- **Purpose**: Student ticketing, welfare requests, academic appeals, and multi-department clearance.
- **Key Capabilities**:
  - Multi-category support ticketing with SLA tracking, internal staff notes, and assignment queues.
  - Configurable multi-step institutional clearance workflows (Finance, Library, Hostel, Academic, Sports, Registrar).
  - Transparent student clearance portal showing progress and pending prerequisites.

### Module 17: Graduation & Alumni Relations
- **Purpose**: Final academic audit, graduation ceremony roster, certificate release, and alumni networking.
- **Key Capabilities**:
  - Automated graduation audit: Validates curriculum completion, CGPA threshold, and full clearance.
  - Graduation fee billing, candidate listing, and ceremony session management.
  - One-click transition of graduated students to verified Alumni accounts with career and event networking.

### Module 18: Communications & Notification Center
- **Purpose**: Centralized multi-channel messaging and institutional alerts.
- **Key Capabilities**:
  - Multi-channel delivery: In-app notification center, transactional Email, SMS alerts.
  - Configurable event-driven templates (e.g., Admission Approved, Payment Received, Grade Published, Low Attendance Warning).
  - Targeted audience broadcasting (filter by campus, faculty, program, cohort, or role).

### Module 19: Document Management & Secure Storage
- **Purpose**: Centralized, secure storage for student, staff, and institutional files.
- **Key Capabilities**:
  - Secure S3-compatible object storage with time-limited pre-signed download URLs.
  - Strict MIME validation, magic-byte inspection, file size limits, and malware scanning hooks.
  - Full audit logging of all document downloads and revisions.

### Module 20: Reporting, Analytics & Executive BI
- **Purpose**: Real-time institutional dashboards, compliance reports, and operational KPIs.
- **Key Capabilities**:
  - Role-tailored dashboards for Students, Lecturers, Registrars, Finance Officers, and Executives.
  - Key institutional KPIs: Enrollment trends, revenue collections, fee aging, pass/fail ratios, retention, staff workload.
  - Filterable report generator with asynchronous PDF/CSV/Excel export capabilities.
