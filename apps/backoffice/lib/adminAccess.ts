import type { AdminPermission, AdminStaffRole } from '@/types/admin';

const ALL_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'users.view',
  'users.manage',
  'verifications.review',
  'verifications.approve',
  'disputes.review',
  'disputes.resolve',
  'fraud.review',
  'fraud.freeze',
  'escrow.view',
  'escrow.approve',
  'audit.view',
  'documents.manage',
  'messages.manage',
  'reports.view',
  'platform.configure',
  'staff.manage',
  'staff.create',
  'staff.approve',
  'shortlet.view',
  'shortlet.moderate',
  'rentals.view',
  'rentals.moderate',
  'rentfinance.view',
  'rentfinance.approve',
  'maintenance.view',
  'maintenance.moderate',
];

export const ADMIN_ROLE_DETAILS: Record<
  AdminStaffRole,
  { label: string; description: string; permissions: AdminPermission[] }
> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Platform governance and emergency access.',
    permissions: ALL_PERMISSIONS,
  },
  backoffice_admin: {
    label: 'Backoffice Admin',
    description: 'General operations across the platform.',
    permissions: ALL_PERMISSIONS.filter((p) => p !== 'staff.manage'),
  },
  verification_officer: {
    label: 'Verification Officer',
    description: 'Reviews identity, property, and licence evidence.',
    permissions: [
      'dashboard.view',
      'users.view',
      'verifications.review',
      'verifications.approve',
      'audit.view',
      'documents.manage',
      'rentals.view',
      'rentals.moderate',
    ],
  },
  fraud_analyst: {
    label: 'Fraud Analyst',
    description: 'Investigates risk signals and recommends protective actions.',
    permissions: [
      'dashboard.view',
      'users.view',
      'fraud.review',
      'fraud.freeze',
      'audit.view',
      'reports.view',
      'rentfinance.view',
    ],
  },
  dispute_officer: {
    label: 'Dispute Officer',
    description: 'Owns dispute investigation and resolution workflows.',
    permissions: [
      'dashboard.view',
      'users.view',
      'disputes.review',
      'disputes.resolve',
      'audit.view',
      'messages.manage',
      'rentals.view',
    ],
  },
  escrow_officer: {
    label: 'Escrow Officer',
    description: 'Reviews escrow milestones and exceptions.',
    permissions: [
      'dashboard.view',
      'users.view',
      'escrow.view',
      'escrow.approve',
      'audit.view',
      'documents.manage',
      'rentfinance.view',
      'rentfinance.approve',
    ],
  },
  finance_approver: {
    label: 'Finance Approver',
    description: 'Approves financial decisions within policy thresholds.',
    permissions: [
      'dashboard.view',
      'escrow.view',
      'escrow.approve',
      'audit.view',
      'reports.view',
      'rentfinance.view',
      'rentfinance.approve',
      'maintenance.view',
    ],
  },
  compliance_manager: {
    label: 'Compliance Manager',
    description: 'Oversees policy, risk, and regulatory controls.',
    permissions: [
      'dashboard.view',
      'users.view',
      'verifications.review',
      'fraud.review',
      'escrow.view',
      'audit.view',
      'documents.manage',
      'reports.view',
      'platform.configure',
      'shortlet.view',
      'rentals.view',
      'rentals.moderate',
      'rentfinance.view',
      'maintenance.view',
      'maintenance.moderate',
    ],
  },
  support_agent: {
    label: 'Support Agent',
    description: 'Assists users without approving or moving money.',
    permissions: [
      'dashboard.view',
      'users.view',
      'messages.manage',
      'shortlet.view',
      'maintenance.view',
    ],
  },
};

const BACKEND_STAFF_ROLE_MAP: Record<string, AdminStaffRole> = {
  SUPER_ADMIN: 'super_admin',
  BACKOFFICE_ADMIN: 'backoffice_admin',
  VERIFICATION_OFFICER: 'verification_officer',
  FRAUD_ANALYST: 'fraud_analyst',
  DISPUTE_OFFICER: 'dispute_officer',
  ESCROW_OFFICER: 'escrow_officer',
  FINANCE_APPROVER: 'finance_approver',
  COMPLIANCE_MANAGER: 'compliance_manager',
  SUPPORT_AGENT: 'support_agent',
};

export function getAdminStaffRole(roles: string[] = []): AdminStaffRole {
  return roles.map((role) => BACKEND_STAFF_ROLE_MAP[role]).find(Boolean) ?? 'backoffice_admin';
}

export function hasAdminPermission(roles: string[] | undefined, permission: AdminPermission) {
  return ADMIN_ROLE_DETAILS[getAdminStaffRole(roles)].permissions.includes(permission);
}

/**
 * Supervisory hierarchy for internal staff roles, mirroring the backend
 * `staff.constants.ts`. Lower number = more senior.
 */
export const STAFF_ROLE_LEVELS: Partial<Record<AdminStaffRole, number>> = {
  super_admin: 0,
  backoffice_admin: 1,
  compliance_manager: 2,
  verification_officer: 2,
  fraud_analyst: 3,
  dispute_officer: 3,
  escrow_officer: 3,
  finance_approver: 3,
  support_agent: 4,
};

/** The actor's most-senior admin level (lowest number among their admin roles). */
export function minAdminLevel(roles: AdminStaffRole[]): number {
  const levels = roles
    .map((role) => STAFF_ROLE_LEVELS[role])
    .filter((level): level is number => level !== undefined);
  return levels.length > 0 ? Math.min(...levels) : Number.POSITIVE_INFINITY;
}

/** True when `role` is strictly subordinate to the actor's most-senior admin role. */
export function isSubordinateRole(actorRoles: AdminStaffRole[], role: AdminStaffRole): boolean {
  const actorLevel = minAdminLevel(actorRoles);
  const targetLevel = STAFF_ROLE_LEVELS[role];
  return targetLevel !== undefined && targetLevel > actorLevel;
}

/** True when the actor holds SUPER_ADMIN. */
export function isSuperAdmin(roles: string[] = []): boolean {
  return getAdminStaffRole(roles) === 'super_admin';
}

/**
 * Roles the signed-in admin is allowed to create: every staff role for a
 * SUPER_ADMIN, otherwise only roles strictly subordinate to their own
 * most-senior admin role.
 */
export function creatableStaffRoles(actorRoles: string[] = []): AdminStaffRole[] {
  const staffRoles = Object.keys(ADMIN_ROLE_DETAILS) as AdminStaffRole[];
  const own = actorRoles
    .map((role) => BACKEND_STAFF_ROLE_MAP[role])
    .filter((role): role is AdminStaffRole => Boolean(role));

  if (isSuperAdmin(actorRoles)) return staffRoles;
  return staffRoles.filter((role) => isSubordinateRole(own, role));
}

/** Whether the user may access the Access & Roles area (manage, create, or approve staff). */
export function hasStaffAccess(roles: string[] | undefined): boolean {
  return (
    hasAdminPermission(roles, 'staff.manage') ||
    hasAdminPermission(roles, 'staff.create') ||
    hasAdminPermission(roles, 'staff.approve')
  );
}
