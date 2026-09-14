# Major Workflows & State Machines
## Enterprise College Management System (CMS)

### 1. Unified Student Lifecycle Workflow

```mermaid
stateDiagram-v2
    [*] --> APPLICANT : Submits Online Application
    APPLICANT --> UNDER_REVIEW : Documents & Application Fee Paid
    UNDER_REVIEW --> INTERVIEW_SCHEDULED : Shortlisted
    UNDER_REVIEW --> REJECTED : Does Not Meet Criteria
    INTERVIEW_SCHEDULED --> ADMITTED : Offer Letter Issued & Accepted
    INTERVIEW_SCHEDULED --> REJECTED : Failed Interview
    ADMITTED --> ACTIVE : Matriculation & Registration Completed
    ACTIVE --> ON_LEAVE : Approved Deferment / Leave
    ON_LEAVE --> ACTIVE : Resumes Studies
    ACTIVE --> SUSPENDED : Disciplinary / Academic Action
    SUSPENDED --> ACTIVE : Reinstated After Hearing
    ACTIVE --> WITHDRAWN : Voluntary Discontinuation
    ACTIVE --> COMPLETED : Final Semester Completed
    COMPLETED --> CLEARANCE_PENDING : Graduation Application
    CLEARANCE_PENDING --> GRADUATED : All Department Clearances Approved
    GRADUATED --> ALUMNI : Converted to Alumni Network
    ALUMNI --> [*]
```

---

### 2. Financial Billing, Payment & Allocation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant System as CMS Finance Engine
    participant Gateway as Payment Gateway (M-Pesa/Bank/Card)
    participant Worker as Background Worker (BullMQ)
    actor Cashier as Finance Officer

    Note over Student, System: Automated Billing Cycle
    System->>System: Generate Semester Tuition & Fee Invoices
    System-->>Student: Push Invoiced Notification & Outstanding Balance

    alt Online Payment (Self-Service)
        Student->>System: Initiate Payment (Amount, Gateway Provider)
        System->>System: Generate Idempotent Transaction Record (PENDING)
        System->>Gateway: Redirect / Initiate Payment Request
        Gateway-->>Student: Complete Payment on Device / 3DSecure
        Gateway->>System: Webhook Callback with Signature & Provider Ref
        System->>System: Verify Cryptographic Webhook Signature
        System->>System: Update Transaction (SUCCESS)
    else Cash / Bank Deposit Counter
        Student->>Cashier: Provide Bank Slip / Cash at Campus Desk
        Cashier->>System: Record Payment with Verified Deposit Ref
        System->>System: Record Transaction (SUCCESS)
    end

    Note over System, Worker: Transactional Allocation & Receipting
    critical Database Transaction
        System->>System: Allocate Payment to Invoices (FIFO / Item Rule)
        System->>System: Generate Official Tamper-Proof Receipt
        System->>System: Re-evaluate Financial Holds (Clear if Balance <= Threshold)
    end

    System->>Worker: Enqueue Receipt PDF Generation & Email Dispatch
    Worker-->>Student: Email Official PDF Receipt & Updated Ledger
```

---

### 3. Academic Grading & Publishing State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Lecturer Enters Assessment Marks
    DRAFT --> DRAFT : Auto-saves and Validates Boundaries
    DRAFT --> SUBMITTED : Lecturer Formally Submits Marks
    SUBMITTED --> UNDER_MODERATION : Head of Department (HoD) Reviews
    UNDER_MODERATION --> REVISION_REQUESTED : HoD Flags Anomalies
    REVISION_REQUESTED --> DRAFT : Lecturer Corrects Marks
    UNDER_MODERATION --> APPROVED : Dean & Exam Committee Sign-off
    APPROVED --> PUBLISHED : Registrar Publishes Grades
    
    state PUBLISHED {
        [*] --> OFFICIAL : Grades Visible on Student Portal
        OFFICIAL --> GRADE_APPEAL : Student Submits Re-evaluation Request
        GRADE_APPEAL --> COMMITTEE_REVIEW : External Moderation
        COMMITTEE_REVIEW --> AMENDED_WITH_AUDIT : Senate Approves Change
        COMMITTEE_REVIEW --> OFFICIAL : Appeal Rejected
    }
```

---

### 4. Course Registration Engine Workflow

```mermaid
flowchart TD
    Start([Student Initiates Registration]) --> CheckWindow{Is Registration Window Open?}
    CheckWindow -- No --> ErrWindow[Show 'Registration Closed' Notice]
    CheckWindow -- Yes --> CheckHolds{Any Financial or Academic Holds?}
    CheckHolds -- Yes --> ErrHold[Block Registration & Display Hold Reason]
    CheckHolds -- No --> SelectCourses[Student Selects Course Sections]
    SelectCourses --> ValidatePrereqs{Prerequisites Satisfied?}
    ValidatePrereqs -- No --> ErrPrereqs[Flag Missing Prerequisite Courses]
    ValidatePrereqs -- Yes --> CheckClashes{Timetable Schedule Clashes?}
    CheckClashes -- Yes --> ErrClashes[Flag Overlapping Class Times]
    CheckClashes -- No --> CheckCredits{Credit Limits Respected?}
    CheckCredits -- No --> ErrCredits[Flag Min/Max Credit Limit Breach]
    CheckCredits -- Yes --> LockCapacity{Class Capacity Available?}
    LockCapacity -- No --> ErrCap[Notify Course Section Full / Add to Waitlist]
    LockCapacity -- Yes --> EnrollTxn[Execute DB Transaction: Lock Seat & Enroll]
    EnrollTxn --> GenerateInvoice[Trigger Fee Invoicing Pipeline]
    GenerateInvoice --> Confirmed([Registration Confirmed & Timetable Populated])
```

---

### 5. Multi-Department Clearance Workflow

```mermaid
flowchart LR
    A[Student Submits Clearance Request] --> B{Parallel Departmental Clearances}
    
    subgraph Departmental Checks
        B --> C1[Finance Dept: Zero Outstanding Balance?]
        B --> C2[Library: All Borrowed Books Returned & Fines Paid?]
        B --> C3[Hostel: Room Key Handed Over & Damage-Free?]
        B --> C4[Academic Dept: Lab Assets & Thesis Returned?]
        B --> C5[Student Affairs: Disciplinary Matters Cleared?]
    end
    
    C1 -- Approved --> D[Consolidation Hub]
    C2 -- Approved --> D
    C3 -- Approved --> D
    C4 -- Approved --> D
    C5 -- Approved --> D
    
    D --> E{All 5 Departments Approved?}
    E -- No --> F[Display Outstanding Clearances to Student]
    E -- Yes --> G[Registrar Final Sign-Off]
    G --> H[Eligible for Graduation List & Degree Certificate]
```
