'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  LockKeyhole,
  Plus,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  UserRoundPlus,
} from 'lucide-react';
import { useAdminUser } from '../layout';
import { CreateStaffModal } from '@/components/admin/access/CreateStaffModal';
import { ResetPasswordModal } from '@/components/admin/access/ResetPasswordModal';
import { StaffApprovalsPanel } from '@/components/admin/access/StaffApprovalsPanel';
import { StaffStatusBadge } from '@/components/admin/access/StaffStatusBadge';
import { Badge } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { ConfirmDialog } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { TableSkeleton } from '@getrentos/ui';
import { Toast, type ToastVariant } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { ADMIN_ROLE_DETAILS, creatableStaffRoles, hasAdminPermission } from '@/lib/adminAccess';
import { formatRelativeTime, getInitials } from '@getrentos/shared';
import type { AdminStaffMember, AdminStaffRole } from '@/types/admin';

const roleOptions = Object.entries(ADMIN_ROLE_DETAILS).map(([role, details]) => ({
  value: role,
  label: details.label,
}));

const PAGE_SIZE = 10;

export default function AdminAccessPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const roles = useMemo(() => user?.roles ?? [], [user]);

  const canManage = hasAdminPermission(roles, 'staff.manage');
  const canCreate = hasAdminPermission(roles, 'staff.create');
  const canApprove = hasAdminPermission(roles, 'staff.approve');
  const creatableRoles = useMemo(() => creatableStaffRoles(roles), [roles]);

  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const notify = (message: string, variant: ToastVariant) => setToast({ message, variant });

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminStaffMember | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    member: AdminStaffMember;
    status: 'active' | 'suspended';
  } | null>(null);
  const [staffPage, setStaffPage] = useState(1);

  const { data: staffData, isLoading } = useQuery({
    queryKey: adminKeys.staffList({ page: staffPage, pageSize: PAGE_SIZE }),
    queryFn: () => unwrap(adminService.listStaff({ page: staffPage, pageSize: PAGE_SIZE })),
    enabled: canManage,
  });
  const staff = staffData?.items ?? [];
  const staffTotal = staffData?.total ?? 0;

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminStaffRole }) =>
      unwrap(adminService.updateStaffRoles(id, [role])),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staff });
      notify('Staff role updated.', 'success');
    },
    onError: (err) =>
      notify(err instanceof Error ? err.message : 'Failed to update role.', 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      unwrap(adminService.setStaffStatus(id, status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staff });
      setStatusTarget(null);
      notify('Staff status updated.', 'success');
    },
    onError: (err) => {
      setStatusTarget(null);
      notify(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    },
  });

  const handleCreated = (approvalStatus: 'APPROVED' | 'PENDING') => {
    queryClient.invalidateQueries({ queryKey: adminKeys.staff });
    queryClient.invalidateQueries({ queryKey: adminKeys.staffApprovals });
    setStaffPage(1);
    notify(
      approvalStatus === 'PENDING'
        ? 'Staff created. It is pending approval by a senior admin.'
        : 'Staff created and active.',
      approvalStatus === 'PENDING' ? 'warning' : 'success'
    );
  };

  const isSelf = (member: AdminStaffMember) => member.email === user?.email;

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent p-2.5 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="type-title">Access & Roles</h1>
            <p className="mt-1 text-muted-foreground">
              Manage internal staff, their roles, and the approval workflow.
            </p>
          </div>
        </div>
        {canCreate && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            Add staff member
          </Button>
        )}
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-warning/30 bg-warning-subtle p-4 text-sm text-foreground">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p>
          <span className="font-semibold">Hierarchy-aware provisioning:</span> a Super Admin can
          create any role; other admins can only create roles subordinate to their own.
          Non-super-admin creations start as <span className="font-medium">pending</span> and must
          be approved by a senior admin before the member can sign in.
        </p>
      </div>

      {canApprove && (
        <div className="mb-6">
          <StaffApprovalsPanel notify={notify} />
        </div>
      )}

      {canManage && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="type-heading">Internal staff</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Full control over staff accounts: change roles, suspend, or reset passwords. Each
              change is recorded in the audit log.
            </p>
          </div>

          {isLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : staff.length === 0 ? (
            <EmptyState
              icon={UserRoundPlus}
              title="No internal staff yet"
              description="Create your first staff member to start assigning roles."
              action={
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                  Add staff member
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {staff.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/60 font-semibold text-xs text-primary-foreground">
                      {getInitials(member.legalName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{member.legalName}</p>
                        {member.staffApproval?.status === 'PENDING' && (
                          <Badge variant="warning">Awaiting approval</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.email ?? 'No email address'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {member.roles.map(({ role }) => (
                          <Badge key={role} variant="neutral">
                            {ADMIN_ROLE_DETAILS[role]?.label ?? role}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StaffStatusBadge status={member.accountStatus} />
                        {member.lastLoginAt && (
                          <span className="text-xs text-muted-foreground">
                            Last login {formatRelativeTime(member.lastLoginAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <Select
                      ariaLabel={`Role for ${member.legalName}`}
                      value={member.roles[0]?.role}
                      disabled={updateRoleMutation.isPending || member.accountStatus === 'pending'}
                      onValueChange={(role) =>
                        updateRoleMutation.mutate({ id: member.id, role: role as AdminStaffRole })
                      }
                      options={roleOptions}
                      className="w-full sm:w-52"
                    />
                    {member.accountStatus === 'suspended' || member.accountStatus === 'banned' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isSelf(member)}
                        onClick={() => setStatusTarget({ member, status: 'active' })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Activate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isSelf(member)}
                        onClick={() => setStatusTarget({ member, status: 'suspended' })}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Suspend
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setResetTarget(member)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset password
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {staffTotal > 0 && (
            <div className="border-t border-border px-5 py-4">
              <Pagination
                page={staffPage}
                pageSize={PAGE_SIZE}
                total={staffTotal}
                onPageChange={setStaffPage}
              />
            </div>
          )}
        </section>
      )}

      {canCreate && (
        <CreateStaffModal
          key={createOpen ? 'create-open' : 'create-closed'}
          open={createOpen}
          onOpenChange={setCreateOpen}
          creatableRoles={creatableRoles}
          onCreated={handleCreated}
        />
      )}

      <ResetPasswordModal
        key={resetTarget?.id ?? 'none'}
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        staff={resetTarget}
        onReset={() => {
          queryClient.invalidateQueries({ queryKey: adminKeys.staff });
          notify('Password reset — all previous sessions were revoked.', 'success');
        }}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.status === 'suspended' ? 'Suspend staff member?' : 'Activate staff member?'
        }
        description={
          statusTarget?.status === 'suspended'
            ? `${statusTarget?.member.legalName} will immediately lose access until reactivated.`
            : `${statusTarget?.member.legalName} will regain access to the platform.`
        }
        confirmLabel={statusTarget?.status === 'suspended' ? 'Suspend' : 'Activate'}
        onConfirm={() =>
          statusTarget &&
          statusMutation.mutate({ id: statusTarget.member.id, status: statusTarget.status })
        }
      />
    </>
  );
}
