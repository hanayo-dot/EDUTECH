# System Requirements Specification (SRS)
## Enterprise College Management System (CMS)

### 1. Document Control & Executive Summary
- **Project**: Enterprise College Management System (CMS)
- **Target Institution Scale**: 10,000+ active students, scalable to 50,000+ users across multi-campus networks.
- **Architectural Philosophy**: Modular, strictly typed, relational integrity, zero hard-coded academic/financial policies, robust server-side security, auditable, high-concurrency resilient.

---

### 2. Functional Requirements (FR)

#### FR-1: Institutional Hierarchy & Scope
- **FR-1.1**: The system must support a multi-tier configurable hierarchy: `Institution` → `Campus` → `Faculty/School` → `Department` → `Program` → `Cohort/Class`.
- **FR-1.2**: Entities, staff, and students must support scoping so that users only see and interact with authorized organizational units.
- **FR-1.3**: Institutional policies (grading scales, attendance thresholds, progression rules, fee structures, payment methods, academic calendars) must be fully configurable per institution and campus.

#### FR-2: Identity, Authentication & Granular RBAC
- **FR-2.1**: Multi-identifier login: Support Email, Username, Student Admission Number, and Staff Number.
- **FR-2.2**: Enterprise password security: Argon2id password hashing, mandatory strong password policies, failed-login protection (exponential backoff & account lockout).
- **FR-2.3**: Session lifecycle: Device-bound JWT access tokens with Redis-backed refresh/revocation mechanisms; ability to invalidate specific device sessions or all active sessions.
- **FR-2.4**: Multi-factor authentication (MFA): TOTP (RFC 6238) with backup recovery codes.
- **FR-2.5**: Granular RBAC: 28+ standard roles with support for custom role creation, role cloning, granular permission assignment (13 standard action verbs: `View`, `Create`, `Edit`, `Delete`, `Approve`, `Reject`, `Publish`, `Export`, `Print`, `Download`, `Import`, `Manage`, `Configure`), and hierarchical data scoping.

#### FR-3: Student Lifecycle Management
- **FR-3.1**: Comprehensive student profile capturing personal, demographic, nationality/passport, emergency contacts, guardian/sponsor, previous institutional qualifications, and academic progression history.
- **FR-3.2**: Configurable student lifecycle statuses: `Applicant`, `Admitted`, `Active`, `Deferred`, `Suspended`, `On Leave`, `Withdrawn`, `Discontinued`, `Completed`, `Graduated`, `Alumni`, `Deceased`.
- **FR-3.3**: Immutable audit tracking for all student status transitions with timestamp, actor ID, and mandatory transition rationale.

#### FR-4: Admissions & Applicant Onboarding
- **FR-4.1**: Public applicant portal supporting dynamic multi-choice program applications, document uploads (transcripts, certificates, IDs), and application fee billing/payment.
- **FR-4.2**: Administrative application review workflow: Intake batches, scoring, eligibility checks, interview scheduling/scoring, conditional and unconditional admission decisions.
- **FR-4.3**: Offer letter generation (branded PDF with verification QR code) and applicant-to-student conversion pipeline preserving the applicant audit trail.

#### FR-5: Academic Structure, Curriculum & Registration
- **FR-5.1**: Multi-term support: Academic years, semesters, trimesters, terms with explicit registration windows, add/drop periods, and period closure locks.
- **FR-5.2**: Versioned curriculum builder: Year of study, semester, courses, credits, prerequisites, core vs. elective classification, minimum/maximum credit limits, and graduation requirements without breaking historical student records.
- **FR-5.3**: Course registration engine: Real-time validation of prerequisites, credit caps, timetable clash detection, room/course capacity, and automated evaluation of financial/academic holds before enrollment confirmation.

#### FR-6: Timetabling & Attendance
- **FR-6.1**: Conflict-free timetabling engine detecting room collisions, lecturer overlaps, and student cohort scheduling clashes across lecture, tutorial, lab, and exam sessions.
- **FR-6.2**: Attendance tracking: Manual lecturer marking, time-limited dynamic QR codes, or external API integration. Real-time calculation of attendance percentages against configurable institutional warning thresholds.

#### FR-7: Assessments, Gradebook & Academic Progression
- **FR-7.1**: Configurable weighted assessment architecture (e.g., CAT 1-3, Quizzes, Lab Work, Midterm, Final Exam) per course section.
- **FR-7.2**: Controlled gradebook workflow: `Draft` → `Submitted` → `Moderated` → `Approved` → `Published`. Published grades cannot be edited without elevated authorization, reason logging, and audit trail entry.
- **FR-7.3**: Automated GPA & CGPA calculation based on configurable grading scales (e.g., 4.0, 5.0, percentage-based, Pass/Fail).
- **FR-7.4**: Academic standing & progression evaluation: Automatic detection of good standing, probation, suspension, repeated courses, and graduation qualification.

#### FR-8: Student Finance, Billing & Payment Reconciliation
- **FR-8.1**: Configurable fee structures (by program, campus, academic year, semester, student residency status).
- **FR-8.2**: Automated invoice generation, adjustments, debit/credit notes, waivers, and scholarship awards.
- **FR-8.3**: Multi-channel payment gateway abstraction (Card, Bank Transfer, Mobile Money, Cash/Counter) supporting idempotent webhook processing, duplicate payment prevention, and tamper-proof receipt generation.
- **FR-8.4**: Transaction allocation logic: Automatic FIFO or rule-based allocation of payments against outstanding invoice items.
- **FR-8.5**: Financial holds: Automated restrictions on course registration, exam card generation, or transcript requests when outstanding balances exceed configurable thresholds.

#### FR-9: Student Services, Clearance & Graduation
- **FR-9.1**: Centralized student ticketing: Academic appeals, fee inquiries, hostel issues, document requests with SLA tracking and assignment.
- **FR-9.2**: Multi-department graduation clearance workflow: Academic, Finance, Library, Hostel, Departmental, and Administration sign-offs.
- **FR-9.3**: Graduation ceremony management, degree certificate and transcript issuance with cryptographic QR verification codes.
- **FR-9.4**: Automatic conversion of graduated students to Alumni profiles with ongoing career, donation, and verification features.

#### FR-10: Communications & Document Management
- **FR-10.1**: Template-driven communications engine supporting Email, SMS, and in-app notifications targeted by campus, program, cohort, or role.
- **FR-10.2**: Secure document storage: Validation of MIME types and magic bytes, file size caps, virus scanning pipeline, S3 signed temporary download URLs, and download auditing.

---

### 3. Non-Functional Requirements (NFR)

#### NFR-1: Performance & Concurrency
- **NFR-1.1**: System must support 10,000+ active users with concurrent registration bursts of 2,500+ requests/sec during peak enrollment windows.
- **NFR-1.2**: 95th percentile response time (p95) < 200ms for read endpoints; < 500ms for write transactions.
- **NFR-1.3**: Zero N+1 query patterns; mandatory pagination (cursor-based for infinite feeds, offset/limit with bounded max for admin tables).

#### NFR-2: High Availability & Scalability
- **NFR-2.1**: Stateless application containers horizontally scalable behind an NGINX / Cloud load balancer.
- **NFR-2.2**: Target uptime: 99.9% service availability during academic semesters.
- **NFR-2.3**: Database architecture supporting connection pooling (PgBouncer), read replicas, and partitioned audit tables.

#### NFR-3: Security & Compliance
- **NFR-3.1**: Strict adherence to OWASP Top 10 guidelines (parameterized queries, input sanitization, CSRF tokens, strict Content Security Policy, rate limiting, and secure cookies).
- **NFR-3.2**: Defense against Insecure Direct Object References (IDOR/BOLA) through tenant and organizational scope verification in backend guards.
- **NFR-3.3**: Monetary amounts stored exclusively as `NUMERIC(14, 2)` (never floating point).
- **NFR-3.4**: All timestamps stored in UTC (`TIMESTAMPTZ`) and rendered according to configured institutional and user timezones.

#### NFR-4: Auditability & Tamper Resistance
- **NFR-4.1**: Append-only immutable audit log table capturing actor, action, entity, entity ID, previous state snapshot, new state snapshot, IP address, and user agent.
- **NFR-4.2**: Separation of duties: Strict server-side enforcement preventing the same user from submitting and approving grades, or creating and reconciling refunds.

#### NFR-5: Accessibility & Responsiveness
- **NFR-5.1**: Compliance with WCAG 2.1 Level AA standards (keyboard navigation, screen reader accessibility, minimum 4.5:1 color contrast, focus indicators).
- **NFR-5.2**: Fully responsive layouts functioning seamlessly across mobile (320px+), tablet, and desktop viewports.
