'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge, EmptyState, QueryState } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { landQueryKeys } from '@/lib/landDiligence';
import { adminLandFraudService, bandTone } from '@/services/adminLandFraudService';

/** Land with fraud signals that still count, worst first. */
export default function AdminLandFraudPage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'fraud.review');
  const query = useQuery({
    queryKey: landQueryKeys.fraudRoot,
    queryFn: () => unwrap(adminLandFraudService.queue()),
    enabled: canView,
  });
  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to fraud signals"
        description="It needs the fraud review permission."
      />
    );
  }
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Land fraud signals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Title or survey files reused from other properties, payout accounts shared between
          sellers, and bank details changed while land money waits. A signal is a reason to look,
          not a verdict. Critical signals hold up approval until cleared; high ones once confirmed.
        </p>
      </div>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError && !query.data}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Signals could not be loaded"
        errorDescription={query.error instanceof Error ? query.error.message : undefined}
        isEmpty={!query.data?.length}
        empty={{
          icon: ShieldCheck,
          title: 'No open signals',
          description: 'The nightly sweep and every parcel save look for new ones.',
        }}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {(query.data ?? []).map((row) => (
            <li key={row.propertyId}>
              <Link
                href={`/admin/land/fraud/${encodeURIComponent(row.propertyId)}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.seller.name} · {row.city}, {row.state} · {row.openSignals} open,{' '}
                    {row.confirmedSignals} confirmed
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {row.blocking && (
                    <Badge variant="danger" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
                      Blocks approval
                    </Badge>
                  )}
                  <Badge variant={bandTone(row.band)}>Score {row.score}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </QueryState>
    </>
  );
}
