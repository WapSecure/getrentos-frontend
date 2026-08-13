'use client';

import { ShieldCheck, LockKeyhole, UsersRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROLE_DETAILS } from '@/lib/adminAccess';
import type { AdminPermission, AdminStaffRole } from '@/types/admin';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import { adminKeys } from '@/lib/queryKeys';
import { Select } from '@/components/ui/Select';

const permissionLabels: Record<AdminPermission, string> = {
  'dashboard.view': 'View operations dashboard',
  'users.view': 'View users',
  'users.manage': 'Manage user accounts',
  'verifications.review': 'Review verifications',
  'verifications.approve': 'Approve or reject verifications',
  'disputes.review': 'Review disputes',
  'disputes.resolve': 'Resolve disputes',
  'fraud.review': 'Investigate fraud alerts',
  'fraud.freeze': 'Freeze accounts or transactions',
  'escrow.view': 'View escrow operations',
  'escrow.approve': 'Approve escrow actions',
  'audit.view': 'View audit logs',
  'documents.manage': 'Manage operational documents',
  'messages.manage': 'Manage support messages',
  'reports.view': 'View platform reports',
  'platform.configure': 'Configure platform controls',
  'staff.manage': 'Manage staff access',
};

export default function AdminAccessPage() {
  const queryClient = useQueryClient();
  const { data: staff = [], isLoading } = useQuery({
    queryKey: adminKeys.staff,
    queryFn: () => unwrap(adminService.listStaff()),
  });
  const updateRolesMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminStaffRole }) =>
      unwrap(adminService.updateStaffRoles(id, [role])),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.staff }),
  });

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent p-2.5 text-primary"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h1 className="type-title">Access & Roles</h1>
            <p className="mt-1 text-muted-foreground">Operational permissions are assigned by staff role.</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-warning/30 bg-warning-subtle p-4 text-sm text-foreground">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p><span className="font-semibold">Separation of duties:</span> sensitive actions such as account freezes and escrow approvals should be enforced by the API with a second approver and an immutable audit event. This screen documents the client permission model; it is not a substitute for backend authorization.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(ADMIN_ROLE_DETAILS).map(([role, details]) => (
          <section key={role} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="type-heading">{details.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{details.description}</p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">{details.permissions.length} permissions</span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {details.permissions.map((permission) => (
                <li key={permission} className="flex items-center gap-2 text-xs text-foreground">
                  <UsersRound className="h-3.5 w-3.5 text-success" />
                  {permissionLabels[permission]}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="type-heading">Internal staff</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign staff roles. The backend records each change in the audit log.
          </p>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading staff access…</p>
        ) : staff.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No internal staff accounts are available yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {staff.map((member) => {
              const currentRole = member.roles[0]?.role ?? 'support_agent';
              return (
                <div key={member.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{member.legalName}</p>
                    <p className="text-sm text-muted-foreground">{member.email ?? 'No email address'}</p>
                  </div>
                  <Select
                    ariaLabel={`Role for ${member.legalName}`}
                    value={currentRole}
                    disabled={updateRolesMutation.isPending}
                    onValueChange={(role) => updateRolesMutation.mutate({ id: member.id, role: role as AdminStaffRole })}
                    options={Object.entries(ADMIN_ROLE_DETAILS).map(([role, details]) => ({ value: role, label: details.label }))}
                    className="w-full sm:w-60"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
