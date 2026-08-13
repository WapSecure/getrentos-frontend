import type { AdminPermission, AdminStaffRole } from '@/types/admin';

const ALL_PERMISSIONS: AdminPermission[] = [
  'dashboard.view', 'users.view', 'users.manage', 'verifications.review', 'verifications.approve',
  'disputes.review', 'disputes.resolve', 'fraud.review', 'fraud.freeze', 'escrow.view',
  'escrow.approve', 'audit.view', 'documents.manage', 'messages.manage', 'reports.view',
  'platform.configure', 'staff.manage',
];

export const ADMIN_ROLE_DETAILS: Record<AdminStaffRole, { label: string; description: string; permissions: AdminPermission[] }> = {
  super_admin: { label: 'Super Admin', description: 'Platform governance and emergency access.', permissions: ALL_PERMISSIONS },
  backoffice_admin: { label: 'Backoffice Admin', description: 'General operations across the platform.', permissions: ALL_PERMISSIONS.filter((p) => p !== 'staff.manage') },
  verification_officer: { label: 'Verification Officer', description: 'Reviews identity, property, and licence evidence.', permissions: ['dashboard.view', 'users.view', 'verifications.review', 'verifications.approve', 'audit.view', 'documents.manage'] },
  fraud_analyst: { label: 'Fraud Analyst', description: 'Investigates risk signals and recommends protective actions.', permissions: ['dashboard.view', 'users.view', 'fraud.review', 'fraud.freeze', 'audit.view', 'reports.view'] },
  dispute_officer: { label: 'Dispute Officer', description: 'Owns dispute investigation and resolution workflows.', permissions: ['dashboard.view', 'users.view', 'disputes.review', 'disputes.resolve', 'audit.view', 'messages.manage'] },
  escrow_officer: { label: 'Escrow Officer', description: 'Reviews escrow milestones and exceptions.', permissions: ['dashboard.view', 'users.view', 'escrow.view', 'audit.view', 'documents.manage'] },
  finance_approver: { label: 'Finance Approver', description: 'Approves financial decisions within policy thresholds.', permissions: ['dashboard.view', 'escrow.view', 'escrow.approve', 'audit.view', 'reports.view'] },
  compliance_manager: { label: 'Compliance Manager', description: 'Oversees policy, risk, and regulatory controls.', permissions: ['dashboard.view', 'users.view', 'verifications.review', 'fraud.review', 'escrow.view', 'audit.view', 'documents.manage', 'reports.view', 'platform.configure'] },
  support_agent: { label: 'Support Agent', description: 'Assists users without approving or moving money.', permissions: ['dashboard.view', 'users.view', 'messages.manage'] },
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
