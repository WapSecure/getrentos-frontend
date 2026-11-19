import type { AdminPermission, AdminStaffRole } from '@/types/admin';

export const ALL_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'users.view',
  'users.suspend',
  'users.security',
  'kyc.review',
  'kyc.approve',
  'properties.review',
  'properties.verify',
  'land.review',
  'land.approve',
  'disputes.review',
  'disputes.resolve',
  'fraud.review',
  'fraud.freeze',
  'escrow.view',
  'escrow.approve',
  'audit.view',
  'documents.manage',
  'support.messages',
  'conversations.read',
  'reports.view',
  'data.export',
  'cases.assign',
  'platform.configure',
  'staff.manage',
  'staff.create',
  'staff.approve',
  'shortlet.view',
  'shortlet.moderate',
  'shortlet.payout',
  'rentals.view',
  'rentals.moderate',
  'rentfinance.view',
  'rentfinance.approve',
  'maintenance.view',
  'maintenance.moderate',
  'sales.view',
  'sales.moderate',
  'professionals.moderate',
  'estate.view',
  'estate.moderate',
  'subscriptions.view',
  'subscriptions.manage',
  'managed.view',
  'managed.operate',
  'ai.observe',
  'collections.manage',
  'diaspora.ops',
];

// Mirrors the backend allocation (docs/backoffice/staff-roles-revamp/05); the API is the authority.
const HEAD_OF_OPERATIONS_EXCLUDED: AdminPermission[] = [
  'staff.manage',
  'escrow.approve',
  'rentfinance.approve',
  'shortlet.payout',
];

export const ADMIN_ROLE_DETAILS: Record<
  AdminStaffRole,
  { label: string; description: string; permissions: AdminPermission[] }
> = {
  super_admin: {
    label: 'Super admin',
    description: 'Platform governance: staff, access, platform settings and emergency access.',
    permissions: ALL_PERMISSIONS,
  },
  backoffice_admin: {
    label: 'Head of operations',
    description: 'Runs the operational queues and the people working them. Does not move money.',
    permissions: ALL_PERMISSIONS.filter((p) => !HEAD_OF_OPERATIONS_EXCLUDED.includes(p)),
  },
  verification_officer: {
    label: 'Verification officer',
    description: 'Identity, KYB, property and land checks.',
    permissions: [
      'dashboard.view',
      'users.view',
      'kyc.review',
      'kyc.approve',
      'properties.review',
      'properties.verify',
      'land.review',
      'land.approve',
      'audit.view',
      'documents.manage',
      'rentals.view',
      'rentals.moderate',
      'diaspora.ops',
    ],
  },
  fraud_analyst: {
    label: 'Fraud analyst',
    description: 'Finds and stops fraud: alerts, risk holds, freezes and professional moderation.',
    permissions: [
      'dashboard.view',
      'users.view',
      'fraud.review',
      'fraud.freeze',
      'audit.view',
      'reports.view',
      'rentfinance.view',
      'sales.view',
      'sales.moderate',
      'professionals.moderate',
      'estate.view',
      'subscriptions.view',
    ],
  },
  dispute_officer: {
    label: 'Dispute officer',
    description: 'Resolves sale, deposit, shortlet and land disputes on evidence.',
    permissions: [
      'dashboard.view',
      'users.view',
      'disputes.review',
      'disputes.resolve',
      'audit.view',
      'support.messages',
      'conversations.read',
      'shortlet.view',
      'rentals.view',
      'sales.view',
      'estate.view',
      'diaspora.ops',
    ],
  },
  escrow_officer: {
    label: 'Escrow officer',
    description: 'Carries out releases, refunds and payouts that policy allows.',
    permissions: [
      'dashboard.view',
      'users.view',
      'escrow.view',
      'escrow.approve',
      'audit.view',
      'documents.manage',
      'shortlet.view',
      'shortlet.payout',
      'rentfinance.view',
      'rentfinance.approve',
      'sales.view',
      'estate.view',
    ],
  },
  finance_approver: {
    label: 'Finance approver',
    description: 'Independent control over money movements, subscriptions and finance reports.',
    permissions: [
      'dashboard.view',
      'escrow.view',
      'escrow.approve',
      'audit.view',
      'reports.view',
      'data.export',
      'shortlet.view',
      'shortlet.payout',
      'rentfinance.view',
      'rentfinance.approve',
      'maintenance.view',
      'sales.view',
      'estate.view',
      'subscriptions.view',
      'subscriptions.manage',
      'managed.view',
    ],
  },
  compliance_manager: {
    label: 'Compliance manager',
    description: 'Independent oversight, privacy reviews and regulatory reporting.',
    permissions: [
      'dashboard.view',
      'users.view',
      'kyc.review',
      'properties.review',
      'land.review',
      'disputes.review',
      'fraud.review',
      'escrow.view',
      'audit.view',
      'documents.manage',
      'conversations.read',
      'reports.view',
      'data.export',
      'cases.assign',
      'shortlet.view',
      'rentals.view',
      'rentals.moderate',
      'rentfinance.view',
      'maintenance.view',
      'maintenance.moderate',
      'sales.view',
      'sales.moderate',
      'professionals.moderate',
      'estate.view',
      'estate.moderate',
      'subscriptions.view',
      'managed.view',
      'diaspora.ops',
    ],
  },
  support_agent: {
    label: 'Support agent',
    description: 'Helps customers and routes issues; never decides cases or moves money.',
    permissions: [
      'dashboard.view',
      'users.view',
      'support.messages',
      'shortlet.view',
      'maintenance.view',
      'estate.view',
      'subscriptions.view',
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

// Personal adjustments live on the server, so once /admin/access/me has loaded it replaces the role table.
let signedInPermissions: ReadonlySet<AdminPermission> | null = null;

export function setSignedInPermissions(permissions: AdminPermission[] | null) {
  signedInPermissions = permissions ? new Set(permissions) : null;
}

// Every caller passes the signed-in user's roles; several roles grant the union of their permissions.
export function hasAdminPermission(roles: string[] | undefined, permission: AdminPermission) {
  if (signedInPermissions) return signedInPermissions.has(permission);
  const staffRoles = (roles ?? [])
    .map((role) => BACKEND_STAFF_ROLE_MAP[role])
    .filter((role): role is AdminStaffRole => Boolean(role));
  const effective = staffRoles.length > 0 ? staffRoles : [getAdminStaffRole(roles)];
  return effective.some((role) => ADMIN_ROLE_DETAILS[role].permissions.includes(permission));
}

// Mirrors the backend staff.constants.ts; a lower number is more senior.
export const STAFF_ROLE_LEVELS: Partial<Record<AdminStaffRole, number>> = {
  super_admin: 0,
  backoffice_admin: 1,
  compliance_manager: 2,
  verification_officer: 3,
  fraud_analyst: 3,
  dispute_officer: 3,
  escrow_officer: 3,
  finance_approver: 2,
  support_agent: 4,
};

export function minAdminLevel(roles: AdminStaffRole[]): number {
  const levels = roles
    .map((role) => STAFF_ROLE_LEVELS[role])
    .filter((level): level is number => level !== undefined);
  return levels.length > 0 ? Math.min(...levels) : Number.POSITIVE_INFINITY;
}

export function isSubordinateRole(actorRoles: AdminStaffRole[], role: AdminStaffRole): boolean {
  const actorLevel = minAdminLevel(actorRoles);
  const targetLevel = STAFF_ROLE_LEVELS[role];
  return targetLevel !== undefined && targetLevel > actorLevel;
}

export function isSuperAdmin(roles: string[] = []): boolean {
  return getAdminStaffRole(roles) === 'super_admin';
}

export function creatableStaffRoles(actorRoles: string[] = []): AdminStaffRole[] {
  const staffRoles = Object.keys(ADMIN_ROLE_DETAILS) as AdminStaffRole[];
  const own = actorRoles
    .map((role) => BACKEND_STAFF_ROLE_MAP[role])
    .filter((role): role is AdminStaffRole => Boolean(role));

  if (isSuperAdmin(actorRoles)) return staffRoles;
  return staffRoles.filter((role) => isSubordinateRole(own, role));
}

export function hasChangeRequestAccess(roles: string[] | undefined): boolean {
  return (
    hasAdminPermission(roles, 'staff.manage') || hasAdminPermission(roles, 'platform.configure')
  );
}

export function hasStaffAccess(roles: string[] | undefined): boolean {
  return (
    hasAdminPermission(roles, 'staff.manage') ||
    hasAdminPermission(roles, 'staff.create') ||
    hasAdminPermission(roles, 'staff.approve')
  );
}

// Staff administration comes only with a role (mirrors the backend ROLE_ONLY_PERMISSIONS).
export const ROLE_ONLY_PERMISSIONS: AdminPermission[] = [
  'staff.manage',
  'staff.create',
  'staff.approve',
];

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  'dashboard.view': 'See the dashboard',
  'users.view': 'Look up users',
  'users.suspend': 'Suspend, ban or reactivate users',
  'users.security': 'Reset two-factor, sign users out, correct legal names',
  'kyc.review': 'Review identity, licence and business checks',
  'kyc.approve': 'Decide identity, licence and business checks',
  'properties.review': 'Review property, floor-plan and development checks',
  'properties.verify': 'Decide property, floor-plan and development checks',
  'land.review': 'Review land diligence, watch and authority',
  'land.approve': 'Decide land diligence, purchases and authority',
  'disputes.review': 'Read disputes',
  'disputes.resolve': 'Resolve disputes',
  'fraud.review': 'Review fraud alerts',
  'fraud.freeze': 'Freeze accounts and funds for fraud',
  'escrow.view': 'See held sale deposits',
  'escrow.approve': 'Release or refund held deposits',
  'audit.view': 'Read the audit log',
  'documents.manage': 'Manage staff documents',
  'support.messages': 'Answer support messages',
  'conversations.read': 'Read private conversations between customers',
  'reports.view': 'See reports',
  'data.export': 'Download bulk data files',
  'cases.assign': 'Give cases to other staff',
  'platform.configure': 'Ask for platform-wide setting changes',
  'staff.manage': 'Manage staff accounts',
  'staff.create': 'Add staff',
  'staff.approve': 'Approve new staff',
  'shortlet.view': 'See shortlets',
  'shortlet.moderate': 'Moderate shortlets',
  'shortlet.payout': 'Pay shortlet hosts',
  'rentals.view': 'See rentals',
  'rentals.moderate': 'Moderate rentals',
  'rentfinance.view': 'See rent money',
  'rentfinance.approve': 'Approve rent money movements',
  'maintenance.view': 'See maintenance',
  'maintenance.moderate': 'Act on maintenance',
  'sales.view': 'See sales',
  'sales.moderate': 'Moderate sales',
  'professionals.moderate': 'Suspend or restore professionals',
  'estate.view': 'See estates',
  'estate.moderate': 'Act on estates',
  'subscriptions.view': 'See subscriptions',
  'subscriptions.manage': 'Change subscriptions',
  'managed.view': 'See managed properties',
  'managed.operate': 'Operate managed properties',
  'ai.observe': 'See automation usage',
  'collections.manage': 'Run collections',
  'diaspora.ops': 'Handle diaspora requests',
};

// Mirrors the backend NIGERIAN_STATES; officers with none handle cases nationwide.
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;
