'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, EmptyState, PageErrorState, Toast } from '@getrentos/ui';
import { UsersRound } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import {
  landRepresentativeKeys,
  landRepresentativeService,
} from '@/services/landRepresentativeService';
import {
  REPRESENTATIVE_SCOPE_LABELS,
  type LandRepresentativeAppointment,
} from '@/types/landRepresentative';

const PrincipalDeals = ({ appointment }: { appointment: LandRepresentativeAppointment }) => {
  const deals = useQuery({
    queryKey: landRepresentativeKeys.deals(appointment.principalId),
    queryFn: () => unwrap(landRepresentativeService.deals(appointment.principalId)),
    enabled: appointment.scopes.includes('VIEW'),
  });
  if (!appointment.scopes.includes('VIEW')) {
    return (
      <p className="text-sm text-muted-foreground">
        You were not given permission to see this buyer’s deals.
      </p>
    );
  }
  if (deals.isLoading)
    return <div className="h-16 animate-pulse rounded-xl bg-secondary" aria-busy="true" />;
  const data = deals.data;
  if (!data || (data.purchases.length === 0 && data.resales.length === 0)) {
    return <p className="text-sm text-muted-foreground">No land deals yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {data.purchases.map((p) => (
        <li key={p.purchaseId}>
          <Link
            href={`/land/representing/purchases/${encodeURIComponent(p.purchaseId)}`}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:underline"
          >
            <span className="text-sm text-foreground">
              {p.title} <span className="text-muted-foreground">· {p.reference}</span>
            </span>
            <span className="flex gap-1.5">
              {p.youApprovePayments && <Badge variant="info">You approve payments</Badge>}
              <Badge variant="neutral">{p.status.toLowerCase().replace(/_/g, ' ')}</Badge>
            </span>
          </Link>
        </li>
      ))}
      {data.resales.map((t) => (
        <li key={t.transactionId}>
          <Link
            href={`/land/representing/transactions/${encodeURIComponent(t.transactionId)}`}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:underline"
          >
            <span className="text-sm text-foreground">
              {t.title}{' '}
              <span className="text-muted-foreground">
                · {formatCurrency(t.amount, { compact: true })}
              </span>
            </span>
            <span className="flex gap-1.5">
              {t.youApprovePayments && <Badge variant="info">You approve payments</Badge>}
              <Badge variant="neutral">{t.escrowStatus.toLowerCase().replace(/_/g, ' ')}</Badge>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

/** Buyers the signed-in person represents, and invitations waiting for an answer. */
export const RepresentingDesk = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: landRepresentativeKeys.representing,
    queryFn: () => unwrap(landRepresentativeService.representing()),
  });
  const respond = useMutation({
    mutationFn: (v: { id: string; response: 'ACCEPT' | 'DECLINE' }) =>
      unwrap(landRepresentativeService.respond(v.id, v.response)),
    onSuccess: (next, v) => {
      queryClient.setQueryData(landRepresentativeKeys.representing, next);
      setToast({
        message: v.response === 'ACCEPT' ? 'You now represent this buyer.' : 'Invitation declined.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  if (list.isLoading)
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (list.isError) {
    return (
      <PageErrorState
        description={list.error instanceof Error ? list.error.message : undefined}
        onRetry={() => list.refetch()}
        isRetrying={list.isRefetching}
      />
    );
  }
  const items = list.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="No one has appointed you"
        description="When a buyer appoints you as their representative on land, it appears here."
      />
    );
  }
  return (
    <>
      <ul className="space-y-4">
        {items.map((appointment) => (
          <li key={appointment.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{appointment.name}</p>
                <p className="text-xs text-muted-foreground">{appointment.email}</p>
              </div>
              <Badge variant={appointment.status === 'ACTIVE' ? 'success' : 'warning'}>
                {appointment.status === 'ACTIVE' ? 'You represent them' : 'Invitation'}
              </Badge>
            </div>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              {appointment.scopes.map((scope) => (
                <li key={scope}>{REPRESENTATIVE_SCOPE_LABELS[scope]}</li>
              ))}
            </ul>
            {appointment.note && (
              <p className="mt-2 rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
                “{appointment.note}”
              </p>
            )}
            {appointment.status === 'INVITED' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  isLoading={respond.isPending && respond.variables?.response === 'ACCEPT'}
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ id: appointment.id, response: 'ACCEPT' })}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ id: appointment.id, response: 'DECLINE' })}
                >
                  Decline
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <PrincipalDeals appointment={appointment} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};
