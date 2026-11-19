'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { History, Users } from '@sureground/icons';
import {
  Badge,
  Button,
  CardSkeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  type BadgeVariant,
} from '@sureground/ui';
import { formatRelativeTime, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import { PERMISSION_LABELS } from '@/lib/adminAccess';
import type { PermissionSensitivity, StaffRoleCatalogueEntry } from '@/types/admin';

const SENSITIVITY: Record<
  PermissionSensitivity,
  { label: string; variant: BadgeVariant; hint: string }
> = {
  GOVERNANCE: { label: 'Governance', variant: 'purple', hint: 'Step-up and a second approver' },
  MONEY: { label: 'Money', variant: 'danger', hint: 'Step-up; a second officer at ₦5m and above' },
  SENSITIVE_DATA: {
    label: 'Sensitive data',
    variant: 'warning',
    hint: 'Step-up; every access audited',
  },
  DECIDE: { label: 'Decide', variant: 'info', hint: 'Reason recorded' },
  READ: { label: 'Read', variant: 'neutral', hint: 'Opening personal documents is audited' },
};
const SENSITIVITY_ORDER: PermissionSensitivity[] = [
  'GOVERNANCE',
  'MONEY',
  'SENSITIVE_DATA',
  'DECIDE',
  'READ',
];
const HISTORY_PAGE_SIZE = 10;

export const RoleCatalogue = ({ canSeeHistory }: { canSeeHistory: boolean }) => {
  const [historyRole, setHistoryRole] = useState<StaffRoleCatalogueEntry | null>(null);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.staffRoleCatalogue,
    queryFn: () => unwrap(adminService.getRoleCatalogue()),
  });

  if (isLoading) return <CardSkeleton lines={6} />;
  if (isError || !data) {
    return (
      <PageErrorState
        title="Roles unavailable"
        description="The role catalogue could not be loaded."
        onRetry={() => refetch()}
        isRetrying={isFetching}
        className="min-h-64"
      />
    );
  }

  const labelOf = (role: string | null) => data.find((entry) => entry.role === role)?.label ?? '—';

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Each role belongs to one department. Seniority decides who may create whom; it never adds
        permissions. One person can be narrowed further, or limited to states, from their Access
        settings.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((entry) => (
          <section key={entry.role} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">{entry.label}</h3>
                <p className="text-sm text-muted-foreground">{entry.departmentLabel}</p>
              </div>
              <Badge variant="neutral" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                {entry.holders} {entry.holders === 1 ? 'person' : 'people'}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-foreground">{entry.purpose}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Reports to</dt>
                <dd className="text-foreground">
                  {entry.reportsTo ? labelOf(entry.reportsTo) : 'Company leadership'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Seniority level</dt>
                <dd className="text-foreground">{entry.level ?? '—'}</dd>
              </div>
            </dl>
            <div className="mt-4 space-y-3">
              {SENSITIVITY_ORDER.map((sensitivity) => {
                const permissions = entry.permissions.filter((p) => p.sensitivity === sensitivity);
                if (!permissions.length) return null;
                const meta = SENSITIVITY[sensitivity];
                return (
                  <div key={sensitivity}>
                    <p className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {meta.hint}
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {permissions.map((p) => (
                        <li
                          key={p.permission}
                          className="rounded-md border border-border px-2 py-0.5 text-xs text-foreground"
                        >
                          {PERMISSION_LABELS[p.permission] ?? p.permission}
                          {p.roleOnly && (
                            <span className="text-muted-foreground"> · role only</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {canSeeHistory && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setHistoryRole(entry)}
              >
                <History className="h-3.5 w-3.5" />
                Change history
              </Button>
            )}
          </section>
        ))}
      </div>

      <RoleHistoryDialog role={historyRole} onClose={() => setHistoryRole(null)} />
    </>
  );
};

const RoleHistoryDialog = ({
  role,
  onClose,
}: {
  role: StaffRoleCatalogueEntry | null;
  onClose: () => void;
}) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.staffRoleHistory(role?.role ?? '', page),
    queryFn: () =>
      unwrap(adminService.getRoleHistory(role!.role, { page, pageSize: HISTORY_PAGE_SIZE })),
    enabled: Boolean(role),
    placeholderData: keepPreviousData,
  });

  return (
    <Dialog
      open={Boolean(role)}
      onOpenChange={(open) => {
        if (open) return;
        setPage(1);
        onClose();
      }}
    >
      <DialogContent size="lg" padded={false}>
        <div className="p-6 sm:p-7">
          <DialogTitle className="font-semibold text-foreground">
            {role?.label}: change history
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Who was given or lost this role, and who did it. Read from the audit log.
          </DialogDescription>
          <div className="mt-5">
            {isLoading ? (
              <ListSkeleton rows={3} label="Loading history" />
            ) : isError || !data ? (
              <p className="text-sm text-destructive">The history could not be loaded.</p>
            ) : data.items.length === 0 ? (
              <EmptyState
                icon={History}
                title="No changes recorded"
                description="Grants and removals of this role will appear here."
                className="border-0 shadow-none"
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-foreground">
                        <Badge
                          variant={item.change === 'GRANTED' ? 'success' : 'neutral'}
                          className="mr-2"
                        >
                          {item.change === 'GRANTED' ? 'Given' : 'Removed'}
                        </Badge>
                        {item.staff?.legalName ?? 'A staff member'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        by {item.actor?.legalName ?? 'the system'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {data && data.total > HISTORY_PAGE_SIZE && (
              <div className="mt-4">
                <Pagination
                  page={page}
                  pageSize={HISTORY_PAGE_SIZE}
                  total={data.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
