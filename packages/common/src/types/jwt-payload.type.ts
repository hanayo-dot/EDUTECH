import { ScopeType, SystemRole } from '../constants/roles.constant';

export interface UserScope {
  scopeType: ScopeType;
  scopeId?: string; // Campus ID, Faculty ID, Department ID, or Program ID
}

export interface JwtPayload {
  sub: string;            // User ID (UUIDv7)
  email: string;
  username: string;
  roles: (SystemRole | string)[];
  scopes: UserScope[];
  sessionId: string;      // Active device session tracking ID
  studentId?: string;     // Linked student ID if role includes STUDENT
  staffId?: string;       // Linked staff ID if faculty/staff
  applicantId?: string;   // Linked applicant ID if applicant
  iat?: number;
  exp?: number;
}
