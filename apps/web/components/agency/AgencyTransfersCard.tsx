'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft } from '@sureground/icons';
import { Badge, Card } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { managementTransferService } from '@/services/managementTransferService';

export function AgencyTransfersCard() {
  const transfers = useQuery({
    queryKey: ['management-transfers', 'managing'],
    queryFn: () => unwrap(managementTransferService.managing()),
  });
  const live = (transfers.data ?? []).filter((t) => t.status === 'OPEN' || t.status === 'SWITCHED');
  if (!live.length) return null;

  return (
    <Card className="mb-6 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <ArrowRightLeft className="h-5 w-5 text-primary" aria-hidden /> Changes of manager
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {live.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-3"
          >
            <div>
              <p className="font-medium text-foreground">{t.propertyName}</p>
              <p className="text-xs text-muted-foreground">
                {t.outgoing ? `${t.outgoing.manager} → ` : 'Owner → '}
                {t.incoming.manager} · {formatDate(t.effectiveAt)}
              </p>
              {t.status === 'OPEN' &&
                !t.incoming.mandateId &&
                t.incoming.manager !== 'the owner' && (
                  <p className="text-xs text-warning">
                    The incoming engagement has not been set up yet. Create it for this property; it
                    will start on the date.
                  </p>
                )}
            </div>
            {t.status === 'SWITCHED' && (
              <Link
                href={`/agency/handover/${t.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Handover
              </Link>
            )}
            <Badge variant={t.status === 'OPEN' ? 'info' : 'success'}>
              {t.status === 'OPEN' ? 'Scheduled' : 'Taken effect'}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
