'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, UserCheck } from 'lucide-react';
import { Badge, EmptyState, Select } from '@getrentos/ui';
import {
  formatDate,
  LAND_AUTHORITY_STATUS_LABELS,
  landAuthorityTone,
  unwrap,
  type LandAuthorityStatus,
} from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { landQueryKeys } from '@/lib/landDiligence';
import { adminLandAuthorityService } from '@/services/adminLandAuthorityService';

const FILTERS: { value: 'open' | LandAuthorityStatus; label: string }[] = [
  { value: 'open', label: 'Waiting on staff' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'PENDING_REVIEW', label: 'Under review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Not accepted' },
  { value: 'DRAFT', label: 'Drafts' },
];

/** Sellers' claims of authority to sell land: disputed and under-review first. */
export default function AdminLandAuthorityQueuePage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const [filter, setFilter] = useState<'open' | LandAuthorityStatus>('open');
  const status = filter === 'open' ? undefined : filter;
  const query = useQuery({
    queryKey: landQueryKeys.authorityQueue(filter),
    queryFn: () => unwrap(adminLandAuthorityService.queue(status)),
    enabled: canView,
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to seller authority"
        description="Reviewing it needs the verifications review permission."
      />
    );
  }

  // Disputes first: the land is effectively frozen until they are resolved.
  const items = [...(query.data ?? [])].sort(
    (a, b) => Number(b.authority.status === 'DISPUTED') - Number(a.authority.status === 'DISPUTED')
  );
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Seller authority</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who claims the right to sell each parcel, on what instrument, and whether everyone whose
          consent it needs has given it. Land review cannot be approved until the claim is verified.
        </p>
      </div>
      <div className="mb-4 w-56">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as typeof filter)}
          ariaLabel="Filter by status"
          options={FILTERS}
        />
      </div>
      {query.isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Claims could not be loaded"
          description={query.error instanceof Error ? query.error.message : undefined}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nothing here"
          description="No claims match this filter."
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map(({ authority, gaps }) => {
            const objections = authority.signatories.filter((s) => s.consent === 'OBJECTED').length;
            return (
              <li key={authority.id}>
                <Link
                  href={`/admin/land/authority/${encodeURIComponent(authority.id)}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {authority.property.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {authority.capacityLabel} · {authority.claimant.legalName} ·{' '}
                      {authority.property.city}
                      {authority.submittedAt && ` · sent ${formatDate(authority.submittedAt)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {objections > 0 && (
                      <Badge variant="danger">
                        {objections} objection{objections === 1 ? '' : 's'}
                      </Badge>
                    )}
                    {gaps.length > 0 && authority.status === 'PENDING_REVIEW' && (
                      <Badge variant="warning">{gaps.length} outstanding</Badge>
                    )}
                    {authority.appeal && authority.status === 'PENDING_REVIEW' && (
                      <Badge variant="info">Appeal</Badge>
                    )}
                    <Badge variant={landAuthorityTone(authority.status)}>
                      {LAND_AUTHORITY_STATUS_LABELS[authority.status]}
                    </Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
