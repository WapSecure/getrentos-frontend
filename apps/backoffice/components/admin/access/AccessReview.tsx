'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from '@sureground/icons';
import {
  Badge,
  EmptyState,
  PageErrorState,
  TableSkeleton,
  ToggleChip,
  type BadgeVariant,
} from '@sureground/ui';
import { formatRelativeTime, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import { ADMIN_ROLE_DETAILS, PERMISSION_LABELS } from '@/lib/adminAccess';
import type { AccessReviewFlag, AdminStaffRole } from '@/types/admin';

const FLAGS: Record<AccessReviewFlag, { label: string; variant: BadgeVariant }> = {
  EMERGENCY_ACCESS_ACTIVE: { label: 'Emergency access active', variant: 'danger' },
  NO_TWO_FACTOR: { label: 'No two-factor', variant: 'danger' },
  MONEY_AND_EXPORT: { label: 'Moves money and exports data', variant: 'warning' },
  EXTRA_PERMISSIONS: { label: 'Extra permissions', variant: 'warning' },
  NOT_SIGNED_IN_30_DAYS: { label: 'No sign-in for 30 days', variant: 'neutral' },
};

const roleLabel = (role: string) =>
  ADMIN_ROLE_DETAILS[role.toLowerCase() as AdminStaffRole]?.label ?? role;

export const AccessReview = () => {
  const [flaggedOnly, setFlaggedOnly] = useState(true);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.accessReview,
    queryFn: () => unwrap(adminService.getAccessReview()),
  });
  const rows = useMemo(
    () => (data ?? []).filter((row) => !flaggedOnly || row.flags.length > 0),
    [data, flaggedOnly]
  );

  if (isLoading) return <TableSkeleton rows={4} columns={4} />;
  if (isError || !data) {
    return (
      <PageErrorState
        title="Access review unavailable"
        description="The review could not be loaded."
        onRetry={() => refetch()}
        isRetrying={isFetching}
        className="min-h-64"
      />
    );
  }

  const flagged = data.filter((row) => row.flags.length > 0).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="type-heading">Access review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Who holds what, when they last signed in, and what deserves a second look. Go through it
            every quarter; narrow anything nobody needs.
          </p>
        </div>
        <div role="group" aria-label="Show" className="flex gap-2">
          <ToggleChip size="sm" pressed={flaggedOnly} onPressedChange={() => setFlaggedOnly(true)}>
            Needs a look ({flagged})
          </ToggleChip>
          <ToggleChip
            size="sm"
            pressed={!flaggedOnly}
            onPressedChange={() => setFlaggedOnly(false)}
          >
            Everyone ({data.length})
          </ToggleChip>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing needs a look"
          description="No one has extra or emergency access, missing two-factor, or a long gap since signing in."
          className="rounded-none border-0 shadow-none"
        />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{row.legalName}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.roles.map(roleLabel).join(', ')} · {row.permissionCount} permissions
                    {row.regions.length ? ` · ${row.regions.join(', ')}` : ' · nationwide'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground sm:text-right">
                  {row.status === 'DEACTIVATED'
                    ? 'Deactivated'
                    : row.lastSignInAt
                      ? `Signed in ${formatRelativeTime(row.lastSignInAt)}`
                      : 'Never signed in'}
                </p>
              </div>
              {row.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.flags.map((flag) => (
                    <Badge key={flag} variant={FLAGS[flag].variant}>
                      {FLAGS[flag].label}
                    </Badge>
                  ))}
                </div>
              )}
              {row.sensitivePermissions.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Sensitive:{' '}
                  {row.sensitivePermissions.map((p) => PERMISSION_LABELS[p] ?? p).join(', ')}
                </p>
              )}
              {row.extraPermissions.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Extra: {row.extraPermissions.map((p) => PERMISSION_LABELS[p] ?? p).join(', ')}
                  {row.extraUntil
                    ? ` until ${new Date(row.extraUntil).toLocaleDateString('en-GB')}`
                    : ' (no end date)'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
