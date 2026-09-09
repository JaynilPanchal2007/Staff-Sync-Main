import { Request } from 'express';
import { dbService } from '../services/db.js';

export function resolveOrgId(req: Request): string {
  const headerOrgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string);
  if (headerOrgId && String(headerOrgId).trim()) return headerOrgId;
  const admin = dbService.getAdmin();
  return admin.organizationId || 'org_school_01';
}

export function resolveAdmin(req: Request): any {
  const orgId = resolveOrgId(req);
  return dbService.getAdminByOrg(orgId) || dbService.getAdmin();
}

export function resolveOrgFromBody(req: Request): string {
  const headerOrgId = (req.headers['x-organization-id'] as string) || (req.body?.organizationId as string);
  if (headerOrgId && String(headerOrgId).trim()) return headerOrgId;
  return resolveOrgId(req);
}

export function sanitizeStaff(staff: any): any {
  if (!staff) return staff;
  const copy = { ...staff };
  delete copy.hashedPassword;
  delete copy.password;
  return copy;
}