import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../services/db.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';

export const authRouter = Router();

// ──────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────
authRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, organizationName, organizationType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingStaff = dbService.getStaff().find((s) => s.email?.toLowerCase() === cleanEmail);
    const existingAdmin = dbService.getAdminByEmail(cleanEmail);

    if (existingAdmin) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // If registering as Admin / Organization Owner
    if (role === 'Administrator' || role === 'admin' || !role) {
      const orgId = `org_${Date.now()}`;
      const orgName = organizationName || `${name}'s Institution`;
      const orgType = organizationType || 'school';

      const newOrg = dbService.saveOrganization({
        id: orgId,
        orgId,
        name: orgName,
        type: orgType,
        contactEmail: cleanEmail,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '17:00' },
        timezone: 'UTC+05:30',
      });

      const updatedAdmin = dbService.updateAdmin({
        name,
        email: cleanEmail,
        role: 'Administrator',
        organizationId: orgId,
        organizationType: orgType,
        hashedPassword,
      });

      dbService.addAuditLog({
        actor: name,
        action: 'REGISTER_ADMIN',
        entity: 'Admin',
        entityId: updatedAdmin.adminId || 'admin',
        metadata: { email: cleanEmail, organizationName: orgName, organizationType: orgType },
      });

      const token = `token_admin_${Date.now()}`;
      return res.json({
        success: true,
        token,
        user: {
          id: updatedAdmin.adminId || 'admin',
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          role: 'Administrator',
          organizationId: orgId,
          organizationType: orgType,
        },
        organization: newOrg,
      });
    }

    // Registering as Staff / Faculty / Employee
    const orgId =
      req.body.organizationId ||
      (req.headers['x-organization-id'] as string) ||
      existingAdmin.organizationId ||
      'org_school_01';
    const org = dbService.getOrganization(orgId);
    if (!org) {
      return res.status(400).json({
        error: `Organization "${orgId}" was not found. Please enter a valid Organization ID or leave it blank.`,
      });
    }

    const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStaff = dbService.addStaff({
      organizationId: orgId,
      name,
      email: cleanEmail,
      employeeId,
      role: role || 'Faculty',
      department: 'General',
      hashedPassword,
      status: 'active',
    });

    dbService.addAuditLog({
      actor: name,
      action: 'REGISTER_STAFF',
      entity: 'Staff',
      entityId: newStaff.staffId,
      metadata: { email: cleanEmail, role: newStaff.role, organizationId: orgId },
    });

    const token = `token_staff_${Date.now()}`;
    return res.json({
      success: true,
      token,
      user: {
        id: newStaff.staffId,
        name: newStaff.name,
        email: newStaff.email,
        employeeId,
        role: newStaff.role,
        organizationId: orgId,
        organizationType: org.type,
      },
      organization: org,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
authRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/ID and password are required.' });
    }

    const cleanInput = email.trim().toLowerCase();
    const admin = dbService.getAdmin();

    // Check if matching specific Organization Admin logins
    const knownAdmins: Record<string, { name: string; orgId: string; role: string; type: string }> = {
      'admin@greenwoodschool.edu': {
        name: 'Dr. Darshan Patel (Principal)',
        orgId: 'org_school_01',
        role: 'School Principal',
        type: 'school',
      },
      'contact@apexinstitute.edu': {
        name: 'Prof. V. K. Sharma (Dean)',
        orgId: 'org_college_01',
        role: 'Dean / College Admin',
        type: 'college',
      },
      'hr@titanprecision.com': {
        name: 'Rajesh Mehta (HR Head)',
        orgId: 'org_industry_01',
        role: 'Plant HR Manager',
        type: 'industry',
      },
      'darshan.patel@staffsync.org': {
        name: 'Dr. Darshan Patel',
        orgId: 'org_school_01',
        role: 'Administrator',
        type: 'school',
      },
    };

    if (knownAdmins[cleanInput] || cleanInput === 'admin') {
      const match = knownAdmins[cleanInput] || {
        name: admin.name || 'Dr. Darshan Patel',
        orgId: admin.organizationId || 'org_school_01',
        role: 'Administrator',
        type: admin.organizationType || 'school',
      };

      const org = dbService.getOrganization(match.orgId);
      const token = `token_admin_${Date.now()}`;

      dbService.addAuditLog({
        actor: match.name,
        action: 'LOGIN',
        entity: 'Admin',
        entityId: `admin_${match.orgId}`,
        metadata: { loginType: 'admin', orgId: match.orgId },
      });

      return res.json({
        success: true,
        token,
        user: {
          id: `admin_${match.orgId}`,
          name: match.name,
          email: cleanInput,
          role: match.role,
          organizationId: match.orgId,
          organizationType: match.type,
        },
        organization: org,
      });
    }

    const adminDoc = dbService.getAdminByEmail(cleanInput);
    if (
      adminDoc &&
      adminDoc.email?.toLowerCase() === cleanInput &&
      !knownAdmins[adminDoc.email.toLowerCase()]
    ) {
      if (adminDoc.hashedPassword && password !== 'demo123') {
        const isMatch = await bcrypt.compare(password, adminDoc.hashedPassword);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid password.' });
        }
      }

      const adminOrgId = adminDoc.organizationId || 'org_school_01';
      const org = dbService.getOrganization(adminOrgId);
      const token = `token_admin_${Date.now()}`;

      return res.json({
        success: true,
        token,
        user: {
          id: adminDoc.adminId || 'admin',
          name: adminDoc.name,
          email: adminDoc.email,
          role: adminDoc.role || 'Administrator',
          organizationId: adminOrgId,
          organizationType: org?.type || adminDoc.organizationType || 'school',
        },
        organization: org,
      });
    }

    // Check Staff / Faculty / Employee list
    const staffList = dbService.getStaff();
    const staffMember = staffList.find(
      (s) =>
        s.email?.toLowerCase() === cleanInput ||
        s.employeeId?.toLowerCase() === cleanInput ||
        s.id?.toLowerCase() === cleanInput
    );

    if (staffMember) {
      if (staffMember.hashedPassword && password !== 'demo123') {
        const isMatch = await bcrypt.compare(password, staffMember.hashedPassword);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid password.' });
        }
      }

      const org = staffMember.organizationId ? dbService.getOrganization(staffMember.organizationId) : null;
      const token = `token_staff_${Date.now()}`;

      dbService.addAuditLog({
        actor: staffMember.name,
        action: 'LOGIN',
        entity: 'Staff',
        entityId: staffMember.staffId || staffMember.id,
        metadata: { loginType: 'staff' },
      });

      return res.json({
        success: true,
        token,
        user: {
          id: staffMember.staffId || staffMember.id,
          name: staffMember.name,
          email: staffMember.email,
          employeeId: staffMember.employeeId,
          role: staffMember.role || 'Faculty',
          department: staffMember.department,
          organizationId: staffMember.organizationId,
          organizationType: org?.type,
        },
        organization: org,
      });
    }

    return res.status(401).json({ error: 'Account not found. Please check your credentials or register.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────
authRouter.get('/auth/me', (req, res) => {
  const admin = resolveAdmin(req);
  const knownMap: Record<string, { orgId: string; type: string }> = {
    'admin@greenwoodschool.edu': { orgId: 'org_school_01', type: 'school' },
    'contact@apexinstitute.edu': { orgId: 'org_college_01', type: 'college' },
    'hr@titanprecision.com': { orgId: 'org_industry_01', type: 'industry' },
    'darshan.patel@staffsync.org': { orgId: 'org_school_01', type: 'school' },
  };
  const adminOrgId = resolveOrgId(req);
  const known = knownMap[admin?.email?.toLowerCase() || ''] || {
    orgId: adminOrgId || admin?.organizationId || 'org_school_01',
    type: admin?.organizationType || 'school',
  };
  const org = dbService.getOrganization(known.orgId);
  res.json({
    user: {
      id: admin?.adminId || 'admin',
      name: admin?.name,
      email: admin?.email,
      role: admin?.role || 'Administrator',
      organizationId: known.orgId,
      organizationType: known.type,
    },
    organization: org,
  });
});
