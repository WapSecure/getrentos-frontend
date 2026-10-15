'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@getrentos/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landDisputeKeys, landDisputeService } from '@/services/landDisputeService';
import { LAND_DISPUTE_KINDS } from '@/types/landDispute';

const kindLabel = (kind: string) => LAND_DISPUTE_KINDS.find((k) => k.value === kind)?.label ?? kind;
const statusLabel = (status: string) => status.replace(/_/g, ' ').toLowerCase();

/** Land disputes I raised, about my land, or on my purchases. */
export default function MyLandDisputesPage() {
  const query = useQuery({
    queryKey: landDisputeKeys.mine,
    queryFn: () => unwrap(landDisputeService.mine()),
  });
  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-24">
        <h1 className="text-2xl font-semibold text-foreground">Land disputes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cases you raised, cases about your land, and cases on your plot purchases.
        </p>
        {query.isLoading ? (
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
        ) : query.isError ? (
          <p className="mt-6 text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : 'Could not load your cases.'}
          </p>
        ) : (query.data ?? []).length === 0 ? (
          <p className="mt-6 rounded-2xl border border-border p-6 text-sm text-muted-foreground">
            You have no land disputes. To report a problem, use “Report a problem” on the land or on
            your purchase.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {(query.data ?? []).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/land/disputes/${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground">
                      {item.reference}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {kindLabel(item.kind)} · {item.propertyTitle} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {item.holdActive && <Badge variant="warning">Land on hold</Badge>}
                    <Badge variant="info">{statusLabel(item.status)}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
