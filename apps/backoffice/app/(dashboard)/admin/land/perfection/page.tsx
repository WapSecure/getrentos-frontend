'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, FileCheck2 } from 'lucide-react';
import { Badge, EmptyState } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminLandPurchaseService } from '@/services/adminLandPurchaseService';

/** Open title perfection cases, exceptions first (§9.5). */
export default function AdminLandPerfectionPage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'sales.view');
  const query = useQuery({
    queryKey: ['admin', 'land', 'perfection'],
    queryFn: () => unwrap(adminLandPurchaseService.perfectionQueue()),
    enabled: canView,
  });
  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to title perfection"
        description="This needs the sales view permission."
      />
    );
  }
  const items = query.data ?? [];
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Title perfection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed plot sales whose title is not yet registered in the buyer&apos;s name.
          Exceptions (a rejected step, or one more than 30 days late) come first.
        </p>
      </div>
      {query.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Nothing open"
          description="Every completed sale's title is perfected, or none has completed yet."
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => (
            <li key={item.purchaseId}>
              <Link
                href={`/admin/land/purchases/${encodeURIComponent(item.purchaseId)}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/40"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">{item.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    Opened {formatDate(item.openedAt)} ·{' '}
                    {item.professionalName ?? 'no professional named'}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {item.lateSteps > 0 && <Badge variant="warning">{item.lateSteps} late</Badge>}
                  <Badge variant={item.status === 'EXCEPTION' ? 'danger' : 'info'}>
                    {item.status.toLowerCase()}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
