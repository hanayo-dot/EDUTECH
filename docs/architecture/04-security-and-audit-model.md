# Security & Audit Model
## Enterprise College Management System (CMS)

### 1. Defense-in-Depth Architecture

```
[Layer 1: Edge & Network]        Cloudflare / NGINX WAF, DDoS mitigation, TLS 1.3, Geo-blocking
[Layer 2: Gateway & Rate Limit]  Redis rate limiting, IP reputation, Helmet security headers, CORS
[Layer 3: Authentication]        Argon2id hashing, Device fingerprinting, TOTP MFA, JWT + Redis blacklist
[Layer 4: Authorization]         Server-side Granular RBAC + Multi-Campus Hierarchical Scoping
[Layer 5: Business Validation]   Class-validator DTOs, prerequisite engines, financial bounds checks
[Layer 6: Persistence & ACID]    PostgreSQL parameterized queries, check constraints, row-level locks
[Layer 7: Storage & Secrets]     S3 pre-signed temporary URLs, AES-256 at rest, strict ENV secret isolation
[Layer 8: Observability & Audit] Append-only audit logs, structured security monitoring, SIEM integration
```

---

### 2. OWASP Top 10 Compliance Matrix

| Threat (OWASP 2021) | CMS Architectural Mitigation |
| :--- | :--- |
| **A01: Broken Access Control** | Every endpoint protected by `@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)`. Direct ID lookups verify the student's campus, department, or personal ID ownership before query execution (preventing IDOR/BOLA). |
| **A02: Cryptographic Failures** | Passwords hashed with `Argon2id` (memoryCost: 65536, timeCost: 3, parallelism: 4). Data at rest encrypted via AES-256. Sensitive identity data (passports/tax IDs) encrypted at column level. |
| **A03: Injection** | 100% parameterized queries via Prisma ORM / SQL query builders. No dynamic raw SQL concatenation. Strict input sanitization against XSS. |
| **A04: Insecure Design** | Separation of duties enforced on financial refunds and grade publication. Four-eyes principle on admissions and clearance sign-offs. |
| **A05: Security Misconfiguration** | Production builds strip all debug headers, stack traces, and GraphQL introspections. Helmet middleware configures CSP, HSTS, X-Content-Type-Options, and Frameguard. |
| **A06: Vulnerable Dependencies** | Automated npm audit / dependency scanning in CI/CD pipeline. Dependabot alerts enabled. |
| **A07: Identification Failures** | Account lockout after 5 consecutive failed attempts (15-minute lock with exponential backoff). Device session invalidation on password reset. |
| **A08: Software/Data Integrity** | Cryptographic HMAC-SHA256 verification on all payment webhooks. File uploads inspected for magic bytes (preventing file extension spoofing). |
| **A09: Logging & Monitoring** | Tamper-evident audit logs capturing user ID, IP, user-agent, action, entity, before/after JSON diffs. Security alerts on privilege escalation attempts. |
| **A10: SSRF** | Outbound requests (webhooks, email dispatches) use dedicated isolated HTTP agents with IP blocklists for loopback (`127.0.0.1`, `::1`) and cloud metadata endpoints (`169.254.169.254`). |

---

### 3. Tamper-Evident Audit Logging Specification
Every state-altering event (Create, Update, Delete, Approve, Reject, Publish, Export) automatically emits a structured audit record:

```typescript
export interface AuditLogEntry {
  id: string;                      // UUIDv7
  userId: string | null;           // User performing action (null for system jobs)
  userEmail: string | null;
  userRole: string;
  impersonatedBy?: string;         // Present if admin is impersonating user
  action: string;                  // 'STUDENT_GRADE_PUBLISH', 'PAYMENT_RECEIVE', etc.
  resource: string;                // 'SemesterGrade', 'Payment', 'User'
  resourceId: string;
  oldValues: Record<string, any>;  // JSON snapshot prior to mutation
  newValues: Record<string, any>;  // JSON snapshot after mutation
  ipAddress: string;
  userAgent: string;
  campusId?: string;
  reason?: string;                 // Mandatory for grade amendments or refunds
  createdAt: string;               // ISO 8601 UTC
}
```

Audit tables are **append-only**. The database user assigned to normal application execution is explicitly revoked of `UPDATE` and `DELETE` permissions on `audit_logs`.

---

### 4. Secure File Upload Pipeline
1. **Client Request**: Client requests a pre-signed upload URL from `/api/v1/documents/upload-intent`.
2. **Pre-validation**: Backend validates file size (`<= 10MB` for docs, `<= 2MB` for photos) and MIME type whitelist (`application/pdf`, `image/jpeg`, `image/png`).
3. **Storage**: Direct upload to private S3 bucket with random UUID key.
4. **Verification Hook**: Async worker verifies magic bytes and submits to ClamAV scanning daemon.
5. **Access Control**: Stored files have zero public URLs. Download requests generate a signed URL valid for exactly 15 minutes, authorized against user RBAC scope.
