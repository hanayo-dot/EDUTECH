import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  resource: string;
  extractResourceId?: (req: any, res: any) => string;
}

export const AUDIT_KEY = 'audit_metadata';
export const Audit = (
  action: string,
  resource: string,
  extractResourceId?: (req: any, res: any) => string,
) => SetMetadata(AUDIT_KEY, { action, resource, extractResourceId });
