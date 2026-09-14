# EduTech Enterprise College Management System (CMS)

A production-ready, enterprise-grade College Management System designed to serve institutions with 10,000+ to 50,000+ concurrent students, faculty, and administrative staff across multi-campus hierarchies.

## Architecture Overview
- **Frontend**: Next.js 14+ (App Router, React, TypeScript, Tailwind CSS, Accessible UI Tokens, WCAG 2.1 AA compliant)
- **Backend API**: NestJS (TypeScript, Modular Architecture, Domain-Driven Design, OpenAPI/Swagger 3.0)
- **Database**: PostgreSQL with strict relational normalization, composite indexing, precision monetary arithmetic (`NUMERIC(14, 2)`), and transaction integrity
- **Cache & Message Broker**: Redis 7+ & BullMQ for asynchronous distributed processing
- **Storage**: S3-compatible Object Storage (MinIO / AWS S3) with signed temporary URLs and virus scanning pipeline
- **Security**: JWT session tokens with Redis revocation, argon2id password hashing, granular scoped RBAC, tamper-evident audit logs, rate-limiting, and OWASP Top 10 defenses

## Documentation Index
- `docs/specs/01-system-requirements-specification.md`
- `docs/specs/02-user-roles-and-permission-matrix.md`
- `docs/specs/03-complete-module-breakdown.md`
- `docs/specs/04-major-workflows-and-state-machines.md`
- `docs/architecture/01-system-and-infrastructure-architecture.md`
- `docs/architecture/02-database-schema-and-erd.md`
- `docs/architecture/03-api-architecture-and-standards.md`
- `docs/architecture/04-security-and-audit-model.md`
- `docs/roadmap/implementation-roadmap.md`

## Engineering Principles
- **Separation of Duties**: Creator != Approver for financial and grading transactions.
- **Configurable Institutional Policies**: Zero hard-coded assumptions for grading scales, attendance rules, progression thresholds, and fee schedules.
- **Strict Server-Side Enforcement**: Permissions, prerequisites, and business rules enforced at database and API layers, never solely on the UI.
