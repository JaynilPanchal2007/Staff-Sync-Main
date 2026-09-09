import { dbService } from '../services/db.js';
export function resolveOrgId(req) {
    const headerOrgId = req.headers['x-organization-id'] || req.query.orgId;
    if (headerOrgId && String(headerOrgId).trim())
        return headerOrgId;
    const admin = dbService.getAdmin();
    return admin.organizationId || 'org_school_01';
}
export function resolveAdmin(req) {
    const orgId = resolveOrgId(req);
    return dbService.getAdminByOrg(orgId) || dbService.getAdmin();
}
export function resolveOrgFromBody(req) {
    const headerOrgId = req.headers['x-organization-id'] || req.body?.organizationId;
    if (headerOrgId && String(headerOrgId).trim())
        return headerOrgId;
    return resolveOrgId(req);
}
export function sanitizeStaff(staff) {
    if (!staff)
        return staff;
    const copy = { ...staff };
    delete copy.hashedPassword;
    delete copy.password;
    return copy;
}
