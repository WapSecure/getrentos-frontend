'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle2, Clock, ShieldAlert, Ban } from 'lucide-react';
import { UserDetailModal } from '@/components/admin/users/UserDetailModal';
import {
  ConfirmDialog,
  DataTable,
  PageErrorState,
  SearchInput,
  SegmentedControl,
  useToast,
  type Column,
} from '@getrentos/ui';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { getInitials, formatDate } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { useAdminSearchParam } from '@/lib/readAdminSearchParam';
import type { PlanTier, PlatformUser, UserAccountStatus, PlatformRole } from '@/types/admin';
import { roleLabel } from '@/lib/roleLabels';

const statusConfig: Record<
  UserAccountStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  active: { label: 'Active', icon: CheckCircle2, variant: 'success' },
  pending: { label: 'Pending', icon: Clock, variant: 'warning' },
  suspended: { label: 'Suspended', icon: ShieldAlert, variant: 'warning' },
  banned: { label: 'Banned', icon: Ban, variant: 'danger' },
};

const planLabel = (tier: PlanTier) =>
  tier === 'ENTERPRISE' ? 'Enterprise' : tier === 'PRO' ? 'Pro' : 'Free';

type StatusFilter = 'all' | UserAccountStatus;
type RoleFilter = 'all' | PlatformRole;

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useAdminSearchParam();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [activeUser, setActiveUser] = useState<PlatformUser | null>(null);
  const [page, setPage] = useState(1);
  const [pendingStatus, setPendingStatus] = useState<{
    user: PlatformUser;
    status: Exclude<UserAccountStatus, 'pending'>;
  } | null>(null);
  const [pendingSubscription, setPendingSubscription] = useState<{
    user: PlatformUser;
    tier: PlanTier;
  } | null>(null);
  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.users({
      search: debouncedSearch,
      status: statusFilter,
      role: roleFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listUsers({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          role: roleFilter === 'all' ? undefined : roleFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
    // This screen shows its own error and retry in place, so a failure must
    // not escalate to the route error boundary and take the page with it.
    throwOnError: false,
  });
  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const changeStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserAccountStatus }) =>
      unwrap(adminService.updateUserStatus(userId, status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setActiveUser(null);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not update account status.'),
  });

  const handleChangeStatus = (userId: string, status: UserAccountStatus) => {
    if (status === 'pending' || changeStatusMutation.isPending) return;
    const user = users.find((item) => item.id === userId) ?? activeUser;
    if (user) setPendingStatus({ user, status });
  };

  const changeSubscriptionMutation = useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: PlanTier }) =>
      unwrap(adminService.updateUserSubscription(userId, tier)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setActiveUser(updated);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not update the subscription.'),
  });

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' },
  ];

  const roleOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'renter', label: 'Renter' },
    { value: 'landlord', label: 'Landlord' },
    { value: 'owner', label: 'Owner' },
    { value: 'buyer', label: 'Buyer' },
    { value: 'realtor', label: 'Realtor' },
    { value: 'agent', label: 'Agent' },
    { value: 'estate', label: 'Estate Manager' },
    { value: 'property_manager', label: 'Property Manager' },
    { value: 'gateman', label: 'Gateman' },
    { value: 'resident', label: 'Resident' },
  ];

  const columns: Column<PlatformUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {getInitials(u.fullName)}
          </div>
          <div className="min-w-0 max-w-xs">
            <p className="font-medium text-foreground [overflow-wrap:anywhere]">{u.fullName}</p>
            <p className="text-xs text-muted-foreground truncate" title={u.email}>
              {u.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {/* Several staff roles all read as one "Staff" badge. */}
          {[...new Set(u.roles)].map((role) => (
            <Badge key={role} variant="neutral">
              {roleLabel(role)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'trustScore',
      header: 'Trust Score',
      render: (u) => <span className="font-medium text-primary">{u.trustScore}</span>,
      className: 'whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => {
        const status = statusConfig[u.status];
        const StatusIcon = status.icon;
        return (
          <Badge variant={status.variant} icon={<StatusIcon className="w-3 h-3" />}>
            {status.label}
          </Badge>
        );
      },
      className: 'whitespace-nowrap',
    },
    {
      key: 'planTier',
      header: 'Plan',
      render: (u) => (
        <Badge variant={u.planTier === 'FREE' ? 'neutral' : 'info'}>{planLabel(u.planTier)}</Badge>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (u) => formatDate(u.joinedDate),
      className: 'text-muted-foreground whitespace-nowrap',
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">
          {/* A count is only stated once the directory has actually loaded. */}
          {data
            ? `${total} user${total === 1 ? '' : 's'} across the platform`
            : isError
              ? 'User count unavailable'
              : 'Loading users…'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          label="Search users"
          placeholder="Search by name or email..."
          className="flex-1 max-w-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value as RoleFilter);
            setPage(1);
          }}
          options={roleOptions}
          ariaLabel="Filter by role"
          searchable={false}
          className="w-full sm:w-44"
        />
      </div>

      <div className="mb-6 max-w-full overflow-x-auto pb-1">
        <SegmentedControl
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          segments={statusOptions}
          aria-label="Filter users by account status"
          size="sm"
        />
      </div>

      {isError && !data ? (
        <PageErrorState
          title="Could not load users"
          description="The user directory is temporarily unavailable. Your filters have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          getRowKey={(u) => u.id}
          onRowClick={(u) => setActiveUser(u)}
          emptyState={<EmptyState icon={Users} title="No users match your filters" />}
          footer={
            total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )
          }
        />
      )}

      <UserDetailModal
        user={activeUser}
        onClose={() => setActiveUser(null)}
        onChangeStatus={handleChangeStatus}
        isChangingStatus={changeStatusMutation.isPending}
        pendingStatus={
          changeStatusMutation.isPending ? changeStatusMutation.variables?.status : undefined
        }
        onChangeSubscription={(userId, tier) => {
          const user = users.find((item) => item.id === userId) ?? activeUser;
          if (user && !changeSubscriptionMutation.isPending) {
            setPendingSubscription({ user, tier });
          }
        }}
        isChangingSubscription={changeSubscriptionMutation.isPending}
      />

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && setPendingStatus(null)}
        title={
          pendingStatus?.status === 'banned'
            ? 'Ban this account?'
            : pendingStatus?.status === 'suspended'
              ? 'Suspend this account?'
              : 'Reactivate this account?'
        }
        description={
          pendingStatus
            ? `${pendingStatus.user.fullName} will be marked ${pendingStatus.status}. ${
                pendingStatus.status === 'active'
                  ? 'They will regain access to the platform.'
                  : 'Their platform access will be restricted immediately.'
              }`
            : ''
        }
        confirmLabel={
          pendingStatus?.status === 'banned'
            ? 'Ban account'
            : pendingStatus?.status === 'suspended'
              ? 'Suspend account'
              : 'Reactivate account'
        }
        isLoading={changeStatusMutation.isPending}
        // Awaited, so the dialog stays open and disabled until the request
        // settles: a second press cannot send the action twice.
        onConfirm={() =>
          pendingStatus && !changeStatusMutation.isPending
            ? changeStatusMutation.mutateAsync({
                userId: pendingStatus.user.id,
                status: pendingStatus.status,
              })
            : undefined
        }
      />
      <ConfirmDialog
        open={pendingSubscription !== null}
        onOpenChange={(open) => !open && setPendingSubscription(null)}
        title={
          pendingSubscription?.tier === 'FREE'
            ? 'Remove paid plan access?'
            : 'Upgrade this account?'
        }
        description={
          pendingSubscription
            ? `${pendingSubscription.user.fullName}'s plan will change from ${planLabel(pendingSubscription.user.planTier)} to ${planLabel(pendingSubscription.tier)}. This changes their product entitlements immediately.`
            : ''
        }
        confirmLabel={
          pendingSubscription?.tier === 'FREE'
            ? 'Move to Free'
            : `Upgrade to ${planLabel(pendingSubscription?.tier ?? 'PRO')}`
        }
        isLoading={changeSubscriptionMutation.isPending}
        onConfirm={() =>
          pendingSubscription && !changeSubscriptionMutation.isPending
            ? changeSubscriptionMutation.mutateAsync({
                userId: pendingSubscription.user.id,
                tier: pendingSubscription.tier,
              })
            : undefined
        }
      />
    </>
  );
}
