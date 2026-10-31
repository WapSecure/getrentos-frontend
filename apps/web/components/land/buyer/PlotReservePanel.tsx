'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Checkbox } from '@getrentos/ui';
import {
  Clock,
  CornerDownRight,
  Lock,
  LogIn,
  Ruler,
  ShieldCheck,
  ScanSearch,
  UserPlus,
  Video,
} from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { LAND_BUYER_ROUTES, signInThen } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys, landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { useBuyerViewer } from '@/lib/viewer';
import { useAddRole } from '@/hooks/useAddRole';
import { landBuyerService } from '@/services/landBuyerService';
import {
  prePurchaseInspectionKeys,
  prePurchaseInspectionService,
} from '@/services/landPrePurchaseInspectionService';
import {
  LAND_PLOT_STATUS_LABELS,
  type LandPlot,
  type LandReservation,
  type PublicLandLayoutDetail,
} from '@/types/landBuyer';
import { StartPurchaseDialog } from './StartPurchaseDialog';
import { RequestTourDialog } from '../tours/RequestTourDialog';
import { RequestInspectionDialog } from '../inspections/RequestInspectionDialog';
import { plotLabel } from './landSaleLogic';

type Viewer = 'buyer' | 'member' | 'anonymous';

/** "1 November 2026 at 12:01 am", in Lagos time: a hold ends at a set minute. */
const formatHoldEnd = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  });

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
  const viewer: Viewer = useBuyerViewer();
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<LandReservation | null>(null);
  const [touring, setTouring] = useState(false);
  const [inspecting, setInspecting] = useState(false);

  // Conditional approval: reservations open once the estate's conditions are met.
  const conditionsOpen = (layout.openConditions?.length ?? 0) > 0;
  const terms = layout.reservationTerms;
  const [accepted, setAccepted] = useState(false);
  const [byInspection, setByInspection] = useState(false);
  // A buyer with an open inspection of this plot may hold it while the inspection runs.
  const inspections = useQuery({
    queryKey: prePurchaseInspectionKeys.mine,
    queryFn: () => unwrap(prePurchaseInspectionService.mine()),
    enabled: viewer === 'buyer' && Boolean(terms?.subjectToInspection),
  });
  const openInspection = plot
    ? inspections.data?.find(
        (inspection) =>
          inspection.plotId === plot.id &&
          inspection.status !== 'ACCEPTED' &&
          inspection.status !== 'CANCELLED'
      )
    : undefined;
  const holdByInspection = byInspection && Boolean(openInspection && terms?.subjectToInspection);
  // A reserved plot may be the viewer's own hold: recognise it and take them
  // straight on to their purchase instead of describing it as someone else's.
  const myReservations = useQuery({
    queryKey: buyerLandKeys.reservations,
    queryFn: () => unwrap(landBuyerService.listReservations()),
    enabled: viewer === 'buyer' && plot?.status === 'RESERVED',
  });
  const myHold = plot
    ? myReservations.data?.find((r) => r.plotId === plot.id && r.status === 'ACTIVE')
    : undefined;
  const reserve = useMutation({
    mutationFn: (plotId: string) =>
      unwrap(
        landBuyerService.reserve(plotId, {
          acceptedTermsVersion: terms.version,
          ...(holdByInspection && openInspection
            ? { subjectToInspectionId: openInspection.id }
            : {}),
        })
      ),
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

      {myHold ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You reserved this plot. Your hold ends {formatHoldEnd(myHold.expiresAt)}.
          </p>
          <Button fullWidth icon={<Lock className="h-4 w-4" />} onClick={() => setHeld(myHold)}>
            Choose a plan and start your purchase
          </Button>
        </div>
      ) : !available ? (
        <p className="text-sm text-muted-foreground">
          {plot.status === 'RESERVED' && plot.heldUntil
            ? `This plot is reserved until ${formatHoldEnd(plot.heldUntil)}. It returns to sale if no purchase starts by then.`
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
        <div className="space-y-3">
          <div className="rounded-xl bg-secondary/50 p-3">
            <p className="text-xs font-medium text-foreground">Reservation terms</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {terms.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
              {holdByInspection && terms.subjectToInspection && (
                <li>{terms.subjectToInspection}</li>
              )}
            </ul>
          </div>
          {openInspection && terms.subjectToInspection && (
            <Checkbox
              checked={byInspection}
              onCheckedChange={setByInspection}
              label="Hold it while my inspection runs"
              description={`Up to ${layout.inspectionHoldDays} days, ending two days after your report is ready.`}
            />
          )}
          <Checkbox
            checked={accepted}
            onCheckedChange={setAccepted}
            label="I have read and accept these terms"
          />
          <Button
            fullWidth
            icon={<Lock className="h-4 w-4" />}
            isLoading={reserve.isPending}
            disabled={!accepted || reserve.isPending || conditionsOpen}
            onClick={() => {
              setError(null);
              reserve.mutate(plot.id);
            }}
          >
            {holdByInspection
              ? 'Reserve while my inspection runs'
              : `Reserve for ${layout.reservationHoldHours} hours`}
          </Button>
        </div>
      )}

      {conditionsOpen && (
        <p className="text-xs text-muted-foreground">
          Reservations open once the conditions on this estate are met.
        </p>
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
          GetRentos holds your payments and releases them to the developer only as you confirm each
          conveyance step.
        </li>
      </ul>
      {viewer === 'buyer' && available && (
        <Button
          fullWidth
          variant="outline"
          icon={<Video className="h-4 w-4" />}
          onClick={() => setTouring(true)}
        >
          Ask for a live video tour
        </Button>
      )}
      {viewer === 'buyer' && available && (
        <Button
          fullWidth
          variant="ghost"
          icon={<ScanSearch className="h-4 w-4" />}
          onClick={() => setInspecting(true)}
        >
          Commission an independent inspection
        </Button>
      )}
      {viewer === 'buyer' && (
        <Link
          href={LAND_BUYER_ROUTES.HUB_RESERVATIONS}
          className="block text-sm font-medium text-primary hover:underline"
        >
          See my reservations
        </Link>
      )}

      <StartPurchaseDialog reservation={held} onClose={() => setHeld(null)} />
      <RequestTourDialog
        open={touring}
        onClose={() => setTouring(false)}
        target={{ plotId: plot.id }}
        landName={`${plotLabel(plot)}, ${layout.name}`}
      />
      <RequestInspectionDialog
        open={inspecting}
        onClose={() => setInspecting(false)}
        target={{ plotId: plot.id }}
        landName={`${plotLabel(plot)}, ${layout.name}`}
      />
    </section>
  );
};
