'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, CheckCircle2, Clock, ShieldAlert, Ban } from 'lucide-react';
import { UserDetailModal } from '@/components/admin/users/UserDetailModal';
import { DataTable, PageErrorState, type Column } from '@getrentos/ui';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { Tabs, TabsList, TabsTrigger } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { getInitials, formatDate } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { PlatformUser, UserAccountStatus, PlatformRole } from '@/types/admin';

const statusConfig: Record<
  UserAccountStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  active: { label: 'Active', icon: CheckCircle2, variant: 'success' },
  pending: { label: 'Pending', icon: Clock, variant: 'warning' },
  suspended: { label: 'Suspended', icon: ShieldAlert, variant: 'warning' },
  banned: { label: 'Banned', icon: Ban, variant: 'danger' },
};

const roleLabels: Record<PlatformRole, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  owner: 'Owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  admin: 'Admin',
};

type StatusFilter = 'all' | UserAccountStatus;
type RoleFilter = 'all' | PlatformRole;

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [activeUser, setActiveUser] = useState<PlatformUser | null>(null);
  const [page, setPage] = useState(1);

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
  });

  const handleChangeStatus = (userId: string, status: UserAccountStatus) => {
    if (status === 'pending') return;
    changeStatusMutation.mutate({ userId, status });
  };

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
  ];

  const columns: Column<PlatformUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
            {getInitials(u.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground whitespace-nowrap">{u.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((role) => (
            <Badge key={role} variant="neutral">
              {roleLabels[role]}
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
          {total} user{total === 1 ? '' : 's'} across the platform
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value as RoleFilter);
            setPage(1);
          }}
          options={roleOptions}
          className="w-full sm:w-44"
        />
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value as StatusFilter);
          setPage(1);
        }}
        className="mb-6"
      >
        <TabsList>
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError ? (
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
      />
    </>
  );
}
