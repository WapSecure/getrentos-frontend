'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, EmptyState, Skeleton, type BadgeVariant } from '@getrentos/ui';
import { ShieldAlert } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ShortletDepositClaim, ShortletDepositClaimStatus } from '@/types/shortlet';

const STATUS_VARIANT: Record<ShortletDepositClaimStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'danger',
  PARTIAL: 'warning',
  REJECTED: 'success',
};

const STATUS_LABEL: Record<ShortletDepositClaimStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  PARTIAL: 'Partially approved',
  REJECTED: 'Rejected',
};

/**
 * Deposit claims list. In the host workspace it lists claims the host filed
 * (or that are against their stays); the guest view is read-only.
 */
export function ShortletDepositClaimsInbox({ role }: { role: 'host' | 'guest' }) {
  const { data, isLoading } = useQuery({
    queryKey: shortletKeys.depositClaims,
    queryFn: () =>
      unwrap(
        role === 'host'
          ? shortletService.myDepositClaims({ page: 1, pageSize: 50 })
          : shortletService.guestDepositClaims({ page: 1, pageSize: 50 })
      ),
  });
  const claims = data?.items ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="max-h-[70vh] overflow-y-auto p-2">
      {isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No deposit claims"
          description={
            role === 'host'
              ? 'Claim against a held deposit after a stay if there was damage.'
              : 'Claims filed against your deposits will appear here.'
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {claims.map((c) => (
            <div key={c.id} className="py-3">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {formatCurrency(c.amount)} · {c.listingTitle ?? 'Shortlet stay'}
                  </p>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {role === 'host' ? `vs ${c.guestName}` : `by ${c.claimedBy}`} ·{' '}
                  {formatDate(c.createdAt, 'short')}
                </p>
              </button>
              {expandedId === c.id && (
                <div className="mt-2 rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">{c.reason}</p>
                  {c.evidence.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.evidence.length} evidence photo{c.evidence.length > 1 ? 's' : ''}
                    </p>
                  )}
                  {c.resolution && (
                    <p className="mt-2 rounded bg-success/10 px-2 py-1 text-xs text-success">
                      Resolution: {c.resolution}
                    </p>
                  )}
                  {c.resolvedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Resolved {formatDate(c.resolvedAt, 'short')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
