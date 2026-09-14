# User Roles & Permission Matrix
## Granular Role-Based Access Control (RBAC) Architecture

### 1. Architectural Principles
1. **Least Privilege by Default**: Every authenticated user possesses zero elevated capabilities unless granted explicitly through assigned roles or direct permission grants.
2. **Dual-Layer Enforcement**: Permissions are evaluated at both the API Gateway/Controller layer (Guards) and Domain Service layer (Scope checks). Client UI hiding is strictly a cosmetic enhancement.
3. **Data Scoping**: Permissions are coupled with hierarchical scope constraints:
   - `GLOBAL`: Entire multi-campus institutional system.
   - `CAMPUS`: Limited to the user's assigned physical campus.
   - `FACULTY`: Limited to the academic faculty/school.
   - `DEPARTMENT`: Limited to a specific academic or administrative department.
   - `PROGRAM`: Limited to assigned study programs.
   - `COHORT`: Limited to assigned academic classes/cohorts.
   - `SELF`: Restricted exclusively to the user's personal records.

---

### 2. Standard Action Verbs (Permission Primitives)
| Action Verb | Code Name | Description |
| :--- | :--- | :--- |
| **View** | `VIEW` | Read access to resources within the authorized scope. |
| **Create** | `CREATE` | Ability to initiate new records. |
| **Edit** | `EDIT` | Ability to modify existing draft or editable records. |
| **Delete** | `DELETE` | Soft-delete capability for non-finalized records. |
| **Approve** | `APPROVE` | Formal workflow authorization (admissions, grades, refunds). |
| **Reject** | `REJECT` | Rejection of submissions with mandatory reason logging. |
| **Publish** | `PUBLISH` | Making records official (timetables, final grades, catalogues). |
| **Export** | `EXPORT` | Bulk data extraction (CSV, Excel) with logged rate limits. |
| **Print** | `PRINT` | Rendering official printable layouts (receipts, cards). |
| **Download** | `DOWNLOAD` | Retrieval of secured stored binary documents. |
| **Import** | `IMPORT` | Batch record ingestion with transactional preview/rollback. |
| **Manage** | `MANAGE` | Operational administration (assigning classes, schedules). |
| **Configure**| `CONFIGURE`| Policy modifications (rules, fee tables, grading scales). |

---

### 3. Role Hierarchy & Matrix
The system ships with 28 out-of-the-box system roles, fully extensible and cloneable via the Security Admin Center:

| # | System Role | Scope Hierarchy | Primary Domains & Permitted Actions |
|---|---|---|---|
| 1 | **Super Administrator** | Global | Full system access, tenant settings, root configurations, audit access. |
| 2 | **Institution Administrator** | Campus / Global | Campus operations, user lifecycle, institutional policies, reports. |
| 3 | **Registrar** | Global | Complete academic records, curriculum oversight, graduation approval, transcripts. |
| 4 | **Deputy / Assistant Registrar** | Campus / Faculty | Enrollment verification, course registration approval, academic notices. |
| 5 | **Admissions Officer** | Campus / Program | Application review, applicant scoring, eligibility checks, offer letters. |
| 6 | **Finance Administrator** | Global / Campus | Fee structure configuration, billing schedules, refund authorization, reconciliation. |
| 7 | **Finance Officer / Cashier** | Campus | Invoicing, payment collection, receipt issuance, day collection reports. |
| 8 | **Academic Administrator** | Faculty / Campus | Timetable generation, academic calendar scheduling, room allocation. |
| 9 | **Dean** | Faculty | Faculty-wide grade approval, workload monitoring, academic probation reviews. |
| 10 | **Head of Department (HoD)** | Department | Course allocations, curriculum proposals, departmental grade sign-off. |
| 11 | **Examination Officer** | Faculty / Campus | Exam timetables, exam room assignments, grade moderation, missing mark audits. |
| 12 | **Lecturer / Instructor** | Assigned Classes | Attendance recording, continuous assessments, grade entry, syllabus uploads. |
| 13 | **Class / Program Coordinator** | Program / Cohort | Cohort monitoring, registration approvals, student advising, timetable feedback. |
| 14 | **Librarian** | Campus / Library | Resource catalogue, check-in/out, overdue fines, library clearance sign-off. |
| 15 | **Hostel / Warden** | Campus / Hostel | Room/bed allocations, check-in/out inspections, maintenance tickets, hostel clearance. |
| 16 | **ICT / System Administrator** | Global | Infrastructure monitoring, identity sync, API tokens, integration maintenance. |
| 17 | **Human Resources Officer** | Global / Campus | Staff profiles, employment contracts, leave management, faculty workload audits. |
| 18 | **Procurement Officer** | Campus | Inventory assets, requisition tracking, departmental resource fulfillment. |
| 19 | **Student Affairs Officer** | Campus | Clubs, disciplinary records, welfare initiatives, event approvals. |
| 20 | **Counselor** | Campus | Confidential counseling sessions, mental health support tickets, referrals. |
| 21 | **Security Officer** | Campus | Incident logs, campus visitor logs, security clearance reviews. |
| 22 | **Parent / Sponsor / Guardian**| Linked Student | View linked student attendance, grades, fee invoices, fee balances, receipts. |
| 23 | **Student** | Self | Course registration, timetable view, attendance, gradebook, fee payment, tickets. |
| 24 | **Applicant** | Self | Application submission, fee payment, document upload, offer acceptance. |
| 25 | **Alumni** | Self | Degree verification, transcript requests, alumni networking, donation portal. |
| 26 | **Auditor** | Global (Read-only)| Complete read-only access to financial ledgers, audit logs, grade revisions. |
| 27 | **Management / Executive** | Global | Executive KPI dashboards, revenue forecasts, retention analytics, enrollment trends. |
| 28 | **Support / Helpdesk Staff** | Campus / Global | Ticket triaging, user assistance, password reset verification, FAQ curation. |

---

### 4. Separation of Duties (Four-Eyes Principle)
To prevent fraud and academic misconduct, the following critical actions enforce separation of duties server-side:

```
[Grade Submission]       Lecturer enters marks  -->  Department HoD reviews  -->  Dean / Registrar approves & publishes
[Financial Refund]       Student / Cashier requests  -->  Finance Admin reviews  -->  Finance Director approves payout
[Admissions Decision]    Officer reviews application -->  Registrar approves offer --> Automated Offer Generation
[Clearance Sign-off]     Departmental Units sign-off (Library, Hostel, Sports, Finance) --> Registrar issues graduation certificate
```

No single user account can simultaneously act as both the initiator and approver for the same record instance.
