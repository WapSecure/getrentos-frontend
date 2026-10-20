'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Gavel, PauseCircle } from 'lucide-react';
import { Badge, Checkbox, EmptyState, Pagination, Select } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { humaniseEnum, landQueryKeys } from '@/lib/landDiligence';
import {
  adminLandDisputeService,
  type ListAdminLandDisputesParams,
} from '@/services/adminLandDisputeService';
import {
  LAND_DISPUTE_KIND_LABELS,
  LAND_DISPUTE_STATUSES,
  type LandDisputeStatus,
} from '@/types/landDispute';

const PAGE_SIZE = 20;

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  ...LAND_DISPUTE_STATUSES.map((status) => ({ value: status, label: humaniseEnum(status) })),
];

/** Land disputes, held cases first then by priority and age. */
export default function AdminLandDisputesPage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const [status, setStatus] = useState<'all' | LandDisputeStatus>('all');
  const [heldOnly, setHeldOnly] = useState(false);
  const [page, setPage] = useState(1);

  const params = useMemo<ListAdminLandDisputesParams>(
    () => ({
      status: status === 'all' ? undefined : status,
      held: heldOnly ? true : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [status, heldOnly, page]
  );
  const query = useQuery({
    queryKey: landQueryKeys.disputes(params),
    queryFn: () => unwrap(adminLandDisputeService.list(params)),
    enabled: canView,
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land disputes"
        description="Reviewing disputes needs the verifications review permission."
      />
    );
  }

  const items = query.data?.items ?? [];
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Land disputes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fraud reports, competing claims, boundary and title problems on land parcels. Held cases
          come first: their land is off the market and payouts on it are paused.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as typeof status);
              setPage(1);
            }}
            ariaLabel="Filter by status"
            options={statusOptions}
          />
        </div>
        <Checkbox
          checked={heldOnly}
          onCheckedChange={(checked) => {
            setHeldOnly(checked);
            setPage(1);
          }}
          label="On hold only"
        />
      </div>

      {query.isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Disputes could not be loaded"
          description={query.error instanceof Error ? query.error.message : undefined}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={Gavel} title="No disputes" description="Nothing matches these filters." />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/land/disputes/${encodeURIComponent(item.id)}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-foreground">{item.reference}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {LAND_DISPUTE_KIND_LABELS[item.kind] ?? item.kind} · {item.propertyTitle} ·
                    raised by {item.raisedByName} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.holdActive && (
                    <Badge variant="danger" icon={<PauseCircle className="h-3.5 w-3.5" />}>
                      On hold
                    </Badge>
                  )}
                  {item.priority === 'HIGH' && <Badge variant="warning">High priority</Badge>}
                  <Badge variant={item.status === 'CLOSED' ? 'neutral' : 'info'}>
                    {humaniseEnum(item.status)}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {query.data && query.data.total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={query.data.total}
          onPageChange={setPage}
          className="mt-7"
        />
      )}
    </>
  );
}
