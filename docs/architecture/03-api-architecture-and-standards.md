# API Architecture & Standards
## Enterprise College Management System (CMS)

### 1. Architectural Style & Principles
- **Style**: RESTful JSON API adhering to Level 3 Richardson Maturity Model principles where applicable.
- **Protocol**: HTTPS / TLS 1.3 mandatory across all endpoints.
- **URI Versioning**: Explicit semantic URI prefixing: `/api/v1/...` to allow non-breaking backwards compatibility.
- **Statelessness**: No server-side HTTP session state; authentication via Bearer JWT with Redis token revocation lists.
- **Standard Serialization**: Dates in ISO 8601 UTC format (`2026-09-14T10:30:00.000Z`), Currency values as fixed-string decimals (`"12500.00"`).

---

### 2. Standard Request & Response Envelopes

#### A. Standard Success Response
```json
{
  "success": true,
  "data": {
    "id": "0191f630-3129-79be-91c6-189ad9e1c271",
    "admissionNumber": "ADM-2026-0042",
    "fullName": "Alice Johnson",
    "status": "ACTIVE"
  },
  "meta": {
    "timestamp": "2026-09-14T10:30:00.000Z",
    "requestId": "req_0191f630-4e4b-7019-b695-1f99c277bf82"
  }
}
```

#### B. Paginated List Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "timestamp": "2026-09-14T10:30:00.000Z",
    "requestId": "req_0191f630-4e4b-7019-b695-1f99c277bf82",
    "pagination": {
      "page": 1,
      "limit": 25,
      "totalRecords": 1420,
      "totalPages": 57,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### C. Standard Error Response
Stack traces and internal database error codes are strictly stripped in production environments.
```json
{
  "success": false,
  "error": {
    "code": "PREREQUISITE_NOT_MET",
    "message": "Cannot enroll in 'CS301 Advanced Algorithms'. Missing prerequisite 'CS201 Data Structures' with minimum grade 'C'.",
    "details": [
      {
        "field": "courseId",
        "issue": "Missing prerequisite CS201"
      }
    ],
    "timestamp": "2026-09-14T10:30:00.000Z",
    "requestId": "req_0191f630-4e4b-7019-b695-1f99c277bf82"
  }
}
```

---

### 3. Rate Limiting & Abuse Prevention

| Tier | Applicable Routes | Window & Limit | Action on Breach |
| :--- | :--- | :--- | :--- |
| **Public Auth / Login** | `/api/v1/auth/login`, `/api/v1/auth/forgot-password` | 5 requests / minute per IP | 429 Too Many Requests + Exponential Backoff |
| **Public Verification** | `/api/v1/verify/certificate/:code` | 20 requests / minute per IP | 429 Too Many Requests |
| **Authenticated Standard** | `/api/v1/students/*`, `/api/v1/courses/*` | 300 requests / minute per User | 429 Too Many Requests |
| **Financial / Transactions**| `/api/v1/finance/payments/*`, `/api/v1/finance/refunds/*` | 30 requests / minute per User | 429 Too Many Requests + Security Flagging |

---

### 4. Idempotency & Concurrency Headers
All state-modifying financial and registration endpoints require an `Idempotency-Key` header:
- Header: `Idempotency-Key: <UUIDv4>`
- Behavior:
  1. The API checks Redis for an active lock on `idempotency:<user_id>:<key>`.
  2. If an identical request is currently processing, concurrent requests receive `409 Conflict`.
  3. If a cached response exists within the 24-hour TTL, the cached response is immediately returned without re-executing payment or enrollment transactions.

---

### 5. Webhook Signature Verification
External payment gateways (e.g., Stripe, M-Pesa Daraja, Bank APIs) must deliver webhooks with HMAC-SHA256 signatures:
- Header: `X-Signature: sha256=<hex_digest>`
- Header: `X-Timestamp: <epoch_seconds>`
- Verification Protocol:
  1. Replay attack window check: Reject any webhook with timestamp variance > 300 seconds.
  2. Cryptographic digest computation: `HMAC_SHA256(secret, timestamp + "." + raw_payload)`.
  3. Constant-time timing-safe comparison (`crypto.timingSafeEqual`).
