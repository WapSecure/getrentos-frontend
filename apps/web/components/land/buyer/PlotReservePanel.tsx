'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button } from '@getrentos/ui';
import { Clock, CornerDownRight, Lock, LogIn, Ruler, ShieldCheck, UserPlus } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { LAND_BUYER_ROUTES, signInThen } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys, landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { viewerHasRole, viewerIsSignedIn } from '@/lib/viewer';
import { useAddRole } from '@/hooks/useAddRole';
import { landBuyerService } from '@/services/landBuyerService';
import {
  LAND_PLOT_STATUS_LABELS,
  type LandPlot,
  type LandReservation,
  type PublicLandLayoutDetail,
} from '@/types/landBuyer';
import { StartPurchaseDialog } from './StartPurchaseDialog';
import { plotLabel } from './landSaleLogic';

type Viewer = 'buyer' | 'member' | 'anonymous';

/**
 * The selected plot and the one thing a visitor can do with it: hold it.
 * Signed-out visitors go to sign-in and come straight back to this plot;
 * a signed-in account without a buyer role is offered one; a buyer reserves
 * in place and is taken on to choose a plan.
 */
export const PlotReservePanel = ({
  layout,
  plot,
}: {
  layout: PublicLandLayoutDetail;
  plot: LandPlot | null;
}) => {
  const queryClient = useQueryClient();
  const addRole = useAddRole();
  const [viewer] = useState<Viewer>(() =>
    viewerHasRole('buyer') ? 'buyer' : viewerIsSignedIn() ? 'member' : 'anonymous'
  );
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<LandReservation | null>(null);

  const reserve = useMutation({
    mutationFn: (plotId: string) => unwrap(landBuyerService.reserve(plotId)),
    onSuccess: (reservation) => {
      setHeld(reservation);
      queryClient.invalidateQueries({ queryKey: landLayoutKeys.detail(layout.id) });
      queryClient.invalidateQueries({ queryKey: buyerLandKeys.reservations });
    },
    onError: (reason: Error) => setError(reason.message),
  });

  if (!plot) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
        Choose a plot on the map or from the list to see its price under each plan and reserve it.
      </div>
    );
  }

  const returnPath = LAND_BUYER_ROUTES.layout(layout.id, plot.id);
  const available = plot.status === 'AVAILABLE';

  return (
    <section
      aria-labelledby="selected-plot"
      className="space-y-4 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="selected-plot" className="text-lg font-semibold text-foreground">
            {plotLabel(plot)}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" aria-hidden />
              {Math.round(plot.areaSqm).toLocaleString('en-NG')} m²
            </span>
            {plot.isCorner && (
              <span className="inline-flex items-center gap-1">
                <CornerDownRight className="h-3.5 w-3.5" aria-hidden /> Corner plot
              </span>
            )}
            {plot.pricePerSqm ? <span>{formatCurrency(plot.pricePerSqm)}/m²</span> : null}
          </p>
        </div>
        <Badge variant={available ? 'success' : 'neutral'}>
          {LAND_PLOT_STATUS_LABELS[plot.status]}
        </Badge>
      </div>

      <p className="text-2xl font-bold text-foreground">{formatCurrency(plot.price)}</p>
      {plot.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {plot.tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {!available ? (
        <p className="text-sm text-muted-foreground">
          {plot.status === 'RESERVED' && plot.heldUntil
            ? `This plot is reserved until ${formatDate(plot.heldUntil)}. If it is your reservation, start your purchase from My land; otherwise it returns to sale if no purchase starts.`
            : 'This plot is no longer for sale.'}
        </p>
      ) : viewer === 'anonymous' ? (
        <Button href={signInThen(returnPath)} fullWidth icon={<LogIn className="h-4 w-4" />}>
          Sign in to reserve
        </Button>
      ) : viewer === 'member' ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Plots are reserved from a buyer account. Add one to this account to hold this plot.
          </p>
          <Button
            fullWidth
            icon={<UserPlus className="h-4 w-4" />}
            isLoading={addRole.isPending}
            disabled={addRole.isPending}
            onClick={() => addRole.mutate({ role: 'buyer', to: returnPath })}
          >
            Add a buyer account
          </Button>
        </div>
      ) : (
        <Button
          fullWidth
          icon={<Lock className="h-4 w-4" />}
          isLoading={reserve.isPending}
          disabled={reserve.isPending}
          onClick={() => {
            setError(null);
            reserve.mutate(plot.id);
          }}
        >
          Reserve for {layout.reservationHoldHours} hours
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <ul className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <li className="flex gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />A reservation is free and
          holds the plot for {layout.reservationHoldHours} hours while you choose a plan. You can
          hold up to 3 plots at a time.
        </li>
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
          Payments are held in escrow and released to the developer only as you confirm each
          conveyance step.
        </li>
      </ul>
      {viewer === 'buyer' && (
        <Link
          href={LAND_BUYER_ROUTES.HUB_RESERVATIONS}
          className="block text-sm font-medium text-primary hover:underline"
        >
          See my reservations
        </Link>
      )}

      <StartPurchaseDialog reservation={held} onClose={() => setHeld(null)} />
    </section>
  );
};
