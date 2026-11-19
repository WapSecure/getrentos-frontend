'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LockKeyhole,
  Plus,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  UserRoundPlus,
  SlidersHorizontal,
  MapPin,
  Mail,
  UserCheck,
  UserX,
} from '@sureground/icons';
import { useAdminUser } from '../layout';
import { CreateStaffModal } from '@/components/admin/access/CreateStaffModal';
import { ResetPasswordModal } from '@/components/admin/access/ResetPasswordModal';
import { StaffApprovalsPanel } from '@/components/admin/access/StaffApprovalsPanel';
import { RoleGrantsPanel, roleGrantErrorMessage } from '@/components/admin/access/RoleGrantsPanel';
import { StaffStatusBadge } from '@/components/admin/access/StaffStatusBadge';
import { StaffAccessModal } from '@/components/admin/access/StaffAccessModal';
import { RoleCatalogue } from '@/components/admin/access/RoleCatalogue';
import { StaffInvitesPanel } from '@/components/admin/access/StaffInvitesPanel';
import { AccessReview } from '@/components/admin/access/AccessReview';
import { Alert, Badge, PageHeader, SearchInput, Tabs, TabsList, TabsTrigger } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { ConfirmDialog } from '@sureground/ui';
import { Select } from '@sureground/ui';
import { EmptyState, PageErrorState } from '@sureground/ui';
import { TableSkeleton } from '@sureground/ui';
import { useToast, type ToastVariant } from '@sureground/ui';
import { Pagination } from '@sureground/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { ADMIN_ROLE_DETAILS, creatableStaffRoles, hasAdminPermission } from '@/lib/adminAccess';
import { formatRelativeTime, getInitials } from '@sureground/shared';
import type {
  AdminStaffMember,
  AdminStaffRole,
  AdminStaffStatus,
  OffboardingSummary,
  StaffDepartment,
} from '@/types/admin';

const PAGE_SIZE = 10;

// A member may also hold a marketplace role, listed first, that the picker has no option for.
function staffRoleOf(member: AdminStaffMember): AdminStaffRole | undefined {
  return member.roles.find(({ role }) => role in ADMIN_ROLE_DETAILS)?.role as
    | AdminStaffRole
    | undefined;
}

export default function AdminAccessPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const roles = useMemo(() => user?.roles ?? [], [user]);

  const canManage = hasAdminPermission(roles, 'staff.manage');
  const canCreate = hasAdminPermission(roles, 'staff.create');
  const canApprove = hasAdminPermission(roles, 'staff.approve');
  const creatableRoles = useMemo(() => creatableStaffRoles(roles), [roles]);

  const toast = useToast();
  const notify = (message: string, variant: ToastVariant) => toast.show(message, variant);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminStaffMember | null>(null);
  const [accessTarget, setAccessTarget] = useState<AdminStaffMember | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    member: AdminStaffMember;
    action: 'deactivate' | 'reactivate';
  } | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [statusTarget, setStatusTarget] = useState<{
    member: AdminStaffMember;
    status: 'active' | 'suspended';
  } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{
    member: AdminStaffMember;
    role: AdminStaffRole;
  } | null>(null);
  const [staffPage, setStaffPage] = useState(1);
  const [tab, setTab] = useState<'staff' | 'roles' | 'review'>(canManage ? 'staff' : 'roles');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminStaffRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<StaffDepartment | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AdminStaffStatus | 'all'>('all');
  const staffFilters = {
    page: staffPage,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    department: departmentFilter === 'all' ? undefined : departmentFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  };
  const { data: catalogue } = useQuery({
    queryKey: adminKeys.staffRoleCatalogue,
    queryFn: () => unwrap(adminService.getRoleCatalogue()),
  });
  const departmentLabels = useMemo(
    () => new Map((catalogue ?? []).map((entry) => [entry.department, entry.departmentLabel])),
    [catalogue]
  );

  const {
    data: staffData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: adminKeys.staffList(staffFilters),
    queryFn: () => unwrap(adminService.listStaff(staffFilters)),
    enabled: canManage,
    placeholderData: keepPreviousData,
  });
  const staff = staffData?.items ?? [];
  const staffTotal = staffData?.total ?? 0;
  const assignableRoles = useMemo(() => new Set(creatableRoles), [creatableRoles]);

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminStaffRole }) =>
      unwrap(adminService.updateStaffRoles(id, [role])),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staff });
      if (result.status === 'PENDING_APPROVAL') {
        queryClient.invalidateQueries({ queryKey: adminKeys.staffRoleGrants });
        notify(
          'Sent for approval. Another super admin has to approve this role change before it applies.',
          'info'
        );
      } else {
        notify('Staff role updated.', 'success');
      }
      setRoleTarget(null);
    },
    onError: (err) => {
      notify(roleGrantErrorMessage(err, 'Failed to update role.'), 'error');
    },
  });

  const lifecycle = useMutation({
    mutationFn: async ({
      member,
      action,
      reason,
    }: {
      member: AdminStaffMember;
      action: 'deactivate' | 'reactivate';
      reason: string;
    }): Promise<{ action: 'deactivate' | 'reactivate'; summary: OffboardingSummary | null }> =>
      action === 'deactivate'
        ? { action, summary: await unwrap(adminService.deactivateStaff(member.id, reason)) }
        : (await unwrap(adminService.requestStaffReactivation(member.id, reason)),
          { action, summary: null }),
    onSuccess: ({ action, summary }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staff });
      queryClient.invalidateQueries({ queryKey: adminKeys.changeRequests });
      queryClient.invalidateQueries({ queryKey: adminKeys.staffInvites });
      const name = lifecycleTarget?.member.legalName ?? 'They';
      setLifecycleTarget(null);
      if (action === 'deactivate' && summary) {
        notify(
          `${name} is deactivated: signed out everywhere, extra access removed, ${summary.casesReturned} open case${summary.casesReturned === 1 ? '' : 's'} returned to the queue.`,
          'success'
        );
      } else {
        notify(
          `Sent for approval. ${name} can sign in again once another super admin approves it.`,
          'info'
        );
      }
    },
    onError: (err) => notify(err instanceof Error ? err.message : 'That did not work.', 'error'),
  });
  const lifecycleBusy = lifecycle.isPending;

  const resendInvite = useMutation({
    mutationFn: (member: AdminStaffMember) => unwrap(adminService.resendStaffInvite(member.id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staffInvites });
      notify(result.message, 'success');
    },
    onError: (err) =>
      notify(err instanceof Error ? err.message : 'The link could not be sent.', 'error'),
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
      notify(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    },
  });

  const handleCreated = (approvalStatus: 'APPROVED' | 'PENDING') => {
    queryClient.invalidateQueries({ queryKey: adminKeys.staff });
    queryClient.invalidateQueries({ queryKey: adminKeys.staffApprovals });
    setStaffPage(1);
    notify(
      approvalStatus === 'PENDING'
        ? 'Staff created. Once a senior admin approves it, they get an email link to set their password.'
        : 'Staff created. We emailed them a link to set their password.',
      approvalStatus === 'PENDING' ? 'warning' : 'success'
    );
  };

  const isSelf = (member: AdminStaffMember) => member.email === user?.email;

  return (
    <>
      <PageHeader
        title="Access & roles"
        description="Manage internal staff, their roles, and the approval workflow."
        actions={
          canCreate ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              Add staff member
            </Button>
          ) : null
        }
      />

      <Alert variant="warning" icon={LockKeyhole} className="mb-6">
        <p>
          <span className="font-semibold">Hierarchy-aware provisioning:</span> a Super Admin can
          create any role; other admins can only create roles subordinate to their own.
          Non-super-admin creations start as <span className="font-medium">pending</span> and must
          be approved by a senior admin before the member can sign in.
        </p>
      </Alert>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'staff' | 'roles' | 'review')}
        className="mb-5"
      >
        <TabsList aria-label="Access and roles view">
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          {canManage && <TabsTrigger value="review">Access review</TabsTrigger>}
        </TabsList>
      </Tabs>

      {tab === 'roles' && <RoleCatalogue canSeeHistory={canManage} />}
      {tab === 'review' && canManage && <AccessReview />}

      {tab === 'staff' && canApprove && (
        <div className="mb-6">
          <StaffApprovalsPanel notify={notify} />
        </div>
      )}

      {tab === 'staff' && canManage && (
        <div className="mb-6">
          <RoleGrantsPanel currentUserId={user?.id} notify={notify} />
        </div>
      )}

      {tab === 'staff' && canManage && (
        <div className="mb-6">
          <StaffInvitesPanel notify={notify} />
        </div>
      )}

      {tab === 'staff' && canManage && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="type-heading">Internal staff</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Full control over staff accounts: change roles, suspend, or reset passwords. Each
              change is recorded in the audit log.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <SearchInput
                value={search}
                onValueChange={(value) => {
                  setSearch(value);
                  setStaffPage(1);
                }}
                placeholder="Name or email"
                label="Search staff"
                className="w-full sm:w-56"
              />
              <Select
                ariaLabel="Filter by department"
                value={departmentFilter}
                onValueChange={(value) => {
                  setDepartmentFilter(value as StaffDepartment | 'all');
                  setStaffPage(1);
                }}
                options={[
                  { value: 'all', label: 'All departments' },
                  ...Array.from(departmentLabels, ([value, label]) => ({ value, label })),
                ]}
                className="w-full sm:w-56"
              />
              <Select
                ariaLabel="Filter by role"
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as AdminStaffRole | 'all');
                  setStaffPage(1);
                }}
                options={[
                  { value: 'all', label: 'All roles' },
                  ...Object.entries(ADMIN_ROLE_DETAILS).map(([value, details]) => ({
                    value,
                    label: details.label,
                  })),
                ]}
                className="w-full sm:w-52"
              />
              <Select
                ariaLabel="Filter by status"
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as AdminStaffStatus | 'all');
                  setStaffPage(1);
                }}
                options={[
                  { value: 'all', label: 'Any status' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Awaiting approval' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                className="w-full sm:w-44"
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : isError && !staffData ? (
            <PageErrorState
              title="Staff directory unavailable"
              description="Staff accounts could not be loaded. No access changes can be made until the current records are available."
              onRetry={() => refetch()}
              isRetrying={isFetching}
              className="min-h-80 border-0"
            />
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
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
                        {member.departments?.map((department) => (
                          <Badge key={department} variant="info">
                            {departmentLabels.get(department) ?? department}
                          </Badge>
                        ))}
                        {member.regions && member.regions.length > 0 && (
                          <Badge variant="neutral" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {member.regions.join(', ')}
                          </Badge>
                        )}
                        {member.adjusted && <Badge variant="warning">Personal access</Badge>}
                        {member.deactivated && <Badge variant="danger">Deactivated</Badge>}
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
                      value={staffRoleOf(member)}
                      disabled={
                        updateRoleMutation.isPending ||
                        isSelf(member) ||
                        member.accountStatus === 'pending'
                      }
                      onValueChange={(role) => {
                        if (role !== staffRoleOf(member))
                          setRoleTarget({ member, role: role as AdminStaffRole });
                      }}
                      options={Object.entries(ADMIN_ROLE_DETAILS).map(([role, details]) => ({
                        value: role,
                        label: details.label,
                        disabled:
                          !assignableRoles.has(role as AdminStaffRole) &&
                          role !== staffRoleOf(member),
                      }))}
                      className="w-full sm:w-52"
                    />
                    {member.deactivated ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isSelf(member) || lifecycleBusy}
                        onClick={() => {
                          setLifecycleReason('');
                          setLifecycleTarget({ member, action: 'reactivate' });
                        }}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Reactivate
                      </Button>
                    ) : member.accountStatus === 'suspended' ||
                      member.accountStatus === 'banned' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isSelf(member) || statusMutation.isPending}
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
                        disabled={isSelf(member) || statusMutation.isPending}
                        onClick={() => setStatusTarget({ member, status: 'suspended' })}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Suspend
                      </Button>
                    )}
                    {!member.deactivated &&
                      member.accountStatus === 'active' &&
                      !member.lastLoginAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          disabled={resendInvite.isPending}
                          onClick={() => resendInvite.mutate(member)}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Resend set-up link
                        </Button>
                      )}
                    {staffRoleOf(member) !== 'super_admin' && !member.deactivated && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isSelf(member)}
                        onClick={() => setAccessTarget(member)}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Access
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      disabled={isSelf(member) || member.accountStatus === 'pending'}
                      onClick={() => setResetTarget(member)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset password
                    </Button>
                    {!member.deactivated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive"
                        disabled={isSelf(member) || lifecycleBusy}
                        onClick={() => {
                          setLifecycleReason('');
                          setLifecycleTarget({ member, action: 'deactivate' });
                        }}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Deactivate
                      </Button>
                    )}
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

      <ConfirmDialog
        open={!!lifecycleTarget}
        onOpenChange={(open) => {
          if (open) return;
          setLifecycleTarget(null);
          setLifecycleReason('');
        }}
        title={
          lifecycleTarget?.action === 'deactivate'
            ? `Deactivate ${lifecycleTarget.member.legalName}?`
            : `Ask to reactivate ${lifecycleTarget?.member.legalName ?? ''}?`
        }
        description={
          lifecycleTarget?.action === 'deactivate'
            ? 'For someone who has left or changed jobs. They are signed out everywhere and cannot sign in; extra and emergency access is removed; their open cases go back to the queue; their pending requests and links stop. Their history is kept. Bringing them back needs a second super admin.'
            : 'Another super admin must approve this before they can sign in again.'
        }
        confirmLabel={lifecycleTarget?.action === 'deactivate' ? 'Deactivate' : 'Send for approval'}
        tone={lifecycleTarget?.action === 'deactivate' ? 'danger' : 'primary'}
        promptLabel="Reason"
        promptPlaceholder={
          lifecycleTarget?.action === 'deactivate'
            ? 'e.g. Left the company on 30 November'
            : 'Why they are coming back'
        }
        promptValue={lifecycleReason}
        onPromptChange={setLifecycleReason}
        promptRequired
        promptMinLength={10}
        isLoading={lifecycle.isPending}
        onConfirm={() =>
          lifecycleTarget &&
          lifecycle.mutate({
            member: lifecycleTarget.member,
            action: lifecycleTarget.action,
            reason: lifecycleReason.trim(),
          })
        }
      />

      <StaffAccessModal
        member={accessTarget}
        onOpenChange={(open) => !open && setAccessTarget(null)}
        notify={notify}
      />

      <ResetPasswordModal
        key={resetTarget?.id ?? 'none'}
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        staff={resetTarget}
        onReset={() => {
          queryClient.invalidateQueries({ queryKey: adminKeys.staff });
          notify(
            'Password reset. They were signed out everywhere and emailed a link to choose a new one.',
            'success'
          );
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
        isLoading={statusMutation.isPending}
        onConfirm={() =>
          statusTarget &&
          statusMutation.mutate({ id: statusTarget.member.id, status: statusTarget.status })
        }
      />
      <ConfirmDialog
        open={!!roleTarget}
        onOpenChange={(open) => !open && setRoleTarget(null)}
        title="Change staff role?"
        description={
          roleTarget
            ? `${roleTarget.member.legalName} will become ${ADMIN_ROLE_DETAILS[roleTarget.role].label}. This grants: ${ADMIN_ROLE_DETAILS[roleTarget.role].permissions.join(', ')}. Any permissions you added or removed for them, and their regions, stay as they are.`
            : ''
        }
        confirmLabel="Change role"
        isLoading={updateRoleMutation.isPending}
        onConfirm={() =>
          roleTarget &&
          updateRoleMutation.mutate({ id: roleTarget.member.id, role: roleTarget.role })
        }
      />
    </>
  );
}
