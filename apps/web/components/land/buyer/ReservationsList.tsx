'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, ConfirmDialog, EmptyState, PageErrorState, Toast } from '@getrentos/ui';
import { Hourglass, MapPinned } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys, landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import type { LandReservation } from '@/types/landBuyer';
import { ReservationStatusBadge } from './LandSaleBadges';
import { StartPurchaseDialog } from './StartPurchaseDialog';
import { countdownTo, plotLabel } from './landSaleLogic';
import { useNow } from './useNow';

/** My plot holds: live ones with a countdown first, the history after. */
export const ReservationsList = () => {
  const queryClient = useQueryClient();
  const now = useNow();
  const [starting, setStarting] = useState<LandReservation | null>(null);
  const [cancelling, setCancelling] = useState<LandReservation | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: buyerLandKeys.reservations,
    queryFn: () => unwrap(landBuyerService.listReservations()),
    // A hold can expire server-side at any moment; keep the list honest.
    refetchInterval: 60_000,
  });

  const cancel = useMutation({
    mutationFn: (reservation: LandReservation) =>
      unwrap(landBuyerService.cancelReservation(reservation.id)),
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: buyerLandKeys.reservations });
      queryClient.invalidateQueries({ queryKey: landLayoutKeys.detail(reservation.layoutId) });
      setToast({ message: `${plotLabel(reservation)} released.`, variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }
  if (isError) {
    return (
      <PageErrorState
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const reservations = data ?? [];
  const live = reservations.filter(
    (r) => r.status === 'ACTIVE' && !countdownTo(r.expiresAt, now).expired
  );
  const past = reservations.filter((r) => !live.includes(r));

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={MapPinned}
        title="No reservations yet"
        description="Reserve a plot in a verified estate to hold it free while you choose a payment plan."
        action={<Button href={LAND_BUYER_ROUTES.LAYOUTS}>Browse estates</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        You can hold up to 3 plots at a time. A hold that runs out puts the plot back on sale.
      </p>
      {live.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          No plot is on hold right now.{' '}
          <Link
            href={LAND_BUYER_ROUTES.LAYOUTS}
            className="font-medium text-primary hover:underline"
          >
            Browse estates
          </Link>
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {live.map((r) => {
            const left = countdownTo(r.expiresAt, now);
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{plotLabel(r)}</h3>
                    <Link
                      href={LAND_BUYER_ROUTES.layout(r.layoutId, r.plotId)}
                      className="text-sm text-primary hover:underline"
                    >
                      {r.layoutName}
                    </Link>
                  </div>
                  <ReservationStatusBadge status={r.status} />
                </div>
                <p className="mt-3 text-xl font-bold text-foreground">{formatCurrency(r.price)}</p>
                <p
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ${
                    left.urgent
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  }`}
                >
                  <Hourglass className="h-4 w-4" aria-hidden />
                  <span>
                    Held for <span className="tabular-nums">{left.label}</span>
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Until {new Date(r.expiresAt).toLocaleString('en-NG')}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button className="sm:flex-1" onClick={() => setStarting(r)}>
                    Start purchase
                  </Button>
                  <Button variant="outline" className="sm:flex-1" onClick={() => setCancelling(r)}>
                    Release plot
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {past.length > 0 && (
        <details className="rounded-2xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Past reservations ({past.length})
          </summary>
          <ul className="mt-3 divide-y divide-border">
            {past.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <span className="text-foreground">
                  {plotLabel(r)} · {r.layoutName}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                  <ReservationStatusBadge status={r.status === 'ACTIVE' ? 'EXPIRED' : r.status} />
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <StartPurchaseDialog reservation={starting} onClose={() => setStarting(null)} />
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Release this plot?"
        description={
          cancelling
            ? `${plotLabel(cancelling)} in ${cancelling.layoutName} goes back on sale straight away, and another buyer may reserve it.`
            : ''
        }
        confirmLabel="Release plot"
        isLoading={cancel.isPending}
        onConfirm={() =>
          cancelling ? cancel.mutateAsync(cancelling).catch(() => undefined) : null
        }
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
