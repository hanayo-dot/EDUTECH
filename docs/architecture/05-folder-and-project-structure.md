# Folder & Project Structure
## Enterprise Monorepo Architecture

The repository is structured as a high-velocity, modular monorepo leveraging npm workspaces, enabling shared type safety, atomic commits, and distinct separation of concerns between client and server layers.

```
EDUTECH/
├── .github/                       # CI/CD workflows (lint, test, build, security scan)
├── apps/
│   ├── api/                       # NestJS Backend API (Modular Monolith)
│   │   ├── src/
│   │   │   ├── common/            # Cross-cutting decorators, filters, guards, interceptors
│   │   │   │   ├── decorators/    # @CurrentUser(), @RequirePermissions(), @Audit()
│   │   │   │   ├── filters/       # GlobalHttpExceptionFilter, PrismaExceptionFilter
│   │   │   │   ├── guards/        # JwtAuthGuard, RolesGuard, ScopeGuard, HoldGuard
│   │   │   │   ├── interceptors/  # AuditLogInterceptor, TransformResponseInterceptor
│   │   │   │   └── pipes/         # ZodValidationPipe, ParseUUIDv7Pipe
│   │   │   ├── config/            # Strongly-typed environment configuration
│   │   │   ├── modules/           # Domain feature modules
│   │   │   │   ├── auth/          # Authentication, MFA, session management
│   │   │   │   ├── rbac/          # Roles, permissions, scoping
│   │   │   │   ├── institution/   # Campuses, faculties, departments, configurations
│   │   │   │   ├── admissions/    # Intake cycles, applications, scoring, matriculation
│   │   │   │   ├── students/      # Student profiles, lifecycle status, advising
│   │   │   │   ├── academics/     # Terms, courses, curriculum builder, catalog
│   │   │   │   ├── registration/  # Course registration, prerequisite checks, holds
│   │   │   │   ├── timetable/     # Timetable scheduling, room allocation, clash checks
│   │   │   │   ├── attendance/    # Session marking, QR code check-in, warnings
│   │   │   │   ├── grading/       # Assessments, gradebook, GPA engine, progression
│   │   │   │   ├── finance/       # Fee structures, invoicing, payments, receipts
│   │   │   │   ├── clearance/     # Multi-department clearance workflows
│   │   │   │   ├── graduation/    # Academic audits, ceremonies, alumni conversion
│   │   │   │   ├── documents/     # Uploads, virus scanning, signed S3 URLs, transcripts
│   │   │   │   ├── notifications/ # Multi-channel templated messaging (Email, SMS, in-app)
│   │   │   │   ├── helpdesk/      # Support ticketing, appeals, requests
│   │   │   │   ├── reports/       # Institutional analytics, KPIs, export engines
│   │   │   │   └── audit/         # Tamper-evident logging and security admin
│   │   │   ├── jobs/              # BullMQ queue producers and background workers
│   │   │   ├── app.module.ts      # Root NestJS application module
│   │   │   └── main.ts            # Application bootstrap & Swagger documentation
│   │   ├── test/                  # E2E & integration test suites
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                       # Next.js 14+ Frontend (App Router, Tailwind CSS)
│       ├── src/
│       │   ├── app/               # App Router pages and route handlers
│       │   │   ├── (auth)/        # Login, MFA verification, password recovery
│       │   │   ├── (portal)/      # Role-based protected portal dashboards
│       │   │   │   ├── student/   # Student self-service portal
│       │   │   │   ├── lecturer/  # Faculty gradebook, attendance, classes
│       │   │   │   ├── registrar/ # Academic structure, enrollment, graduation
│       │   │   │   ├── finance/   # Invoicing, cashier desk, reconciliation
│       │   │   │   └── admin/     # Institutional settings, RBAC, audit logs
│       │   │   ├── verify/        # Public document verification portal (QR target)
│       │   │   └── apply/         # Public online admissions portal
│       │   ├── components/        # Reusable Accessible UI Components (Design System)
│       │   │   ├── ui/            # Buttons, Inputs, Dialogs, Badges, Tables, Cards
│       │   │   ├── forms/         # Dynamic form builders, validation hooks
│       │   │   ├── tables/        # Enterprise DataTable (pagination, filter, export)
│       │   │   └── layout/        # Responsive sidebars, headers, breadcrumbs
│       │   ├── hooks/             # Custom React hooks (useAuth, usePermissions)
│       │   ├── lib/               # API client, token helpers, formatters (money, dates)
│       │   └── styles/            # Tailwind CSS design tokens and theme variables
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                  # Centralized Prisma Schema & Data Layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Unified database schema
│   │   │   ├── migrations/        # Version-controlled SQL migrations
│   │   │   └── seed.ts            # Realistic multi-campus seed data script
│   │   ├── src/                   # Exported PrismaClient instance & utilities
│   │   └── package.json
│   │
│   └── common/                    # Shared TypeScript interfaces, DTOs & Constants
│       ├── src/
│       │   ├── constants/         # Roles, permissions, statuses, error codes
│       │   ├── types/             # Domain model types, API responses, envelopes
│       │   └── utils/             # Timezone helpers, decimal money formatting
│       └── package.json
│
├── docker/                        # Local & production Docker compose files
│   ├── docker-compose.yml         # Core services: Postgres 16, Redis 7, MinIO, Mailpit
│   └── Dockerfile.api             # Production multi-stage Docker build for API
│   └── Dockerfile.web             # Production multi-stage Docker build for Web UI
│
├── docs/                          # Comprehensive system architecture & specs
├── package.json                   # Monorepo root package.json (npm workspaces)
└── README.md
```
