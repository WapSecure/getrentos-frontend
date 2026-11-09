'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';
import { Badge, Card, DataTable, Skeleton, type Column } from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import {
  agencyTrustService,
  AGENCY_TRUST_ENTRY_LABELS,
  type AgencyTrustEntry,
} from '@/services/agencyTrustService';

const columns: Column<AgencyTrustEntry>[] = [
  {
    key: 'date',
    header: 'Date',
    className: 'text-muted-foreground',
    render: (e) => formatDate(e.occurredAt),
  },
  {
    key: 'movement',
    header: 'Movement',
    render: (e) => AGENCY_TRUST_ENTRY_LABELS[e.entryType] ?? e.entryType,
  },
  {
    key: 'property',
    header: 'Property',
    className: 'text-muted-foreground',
    render: (e) => <span className="block max-w-[14rem] truncate">{e.propertyTitle ?? '—'}</span>,
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    className: 'font-medium',
    render: (e) => (
      <span className={e.amount >= 0 ? 'text-success' : 'text-foreground'}>
        {e.amount >= 0 ? '+' : '−'}
        {formatCurrency(Math.abs(e.amount))}
      </span>
    ),
  },
  {
    key: 'balance',
    header: 'Balance',
    numeric: true,
    className: 'text-muted-foreground',
    render: (e) => formatCurrency(e.balanceAfter),
  },
];

// When the stored balance disagrees with the sum of its entries the card says so, rather than show a figure the ledger can't back.
export function AgencyOwnerTrustCard({ ownerId }: { ownerId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agency', 'trust', ownerId],
    queryFn: () => unwrap(agencyTrustService.getOwnerTrust(ownerId)),
  });

  return (
    <div className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        Client money held
      </h2>
      <Card className="rounded-2xl p-5">
        {isLoading ? (
          <div role="status" aria-label="Loading the ledger" className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        ) : isError && !data ? (
          <p className="text-sm text-muted-foreground">We couldn’t load this client’s ledger.</p>
        ) : !data || data.balance === null ? (
          <p className="text-sm text-muted-foreground">
            No money has moved through your account for this client yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Balance you hold</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(data.balance)}</p>
              </div>
              {data.inSync ? (
                <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
                  Reconciled
                </Badge>
              ) : (
                <Badge
                  variant="warning"
                  icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
                >
                  Drift: ledger sums to {formatCurrency(data.reconciledBalance)}
                </Badge>
              )}
            </div>

            {data.protection ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                Protected under {data.protection.schemeName}
                {data.protection.coverageAmount != null
                  ? ` · up to ${formatCurrency(data.protection.coverageAmount)}`
                  : ''}
              </p>
            ) : (
              <Link
                href="/agency/protection"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-warning hover:underline"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                No client-money protection on record. Add one
              </Link>
            )}

            {data.entries.length > 0 && (
              <DataTable
                variant="bare"
                className="mt-4"
                caption="Client money movements"
                density="compact"
                columns={columns}
                data={data.entries}
                getRowKey={(e) => e.id}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
