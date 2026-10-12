'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys, landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService, landLayoutService } from '@/services/landBuyerService';
import type { LandReservation } from '@/types/landBuyer';
import { PaymentPlanCard } from './PaymentPlanCard';
import { countdownTo, plotLabel, quotePlot } from './landSaleLogic';

/**
 * Turns a held plot into a purchase on one of the estate's active plans. The
 * contract freezes the plan and fees at this moment; the buyer then pays the
 * deposit from the purchase page.
 */
export const StartPurchaseDialog = ({
  reservation,
  onClose,
}: {
  reservation: LandReservation | null;
  onClose: () => void;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const layout = useQuery({
    queryKey: landLayoutKeys.detail(reservation?.layoutId ?? ''),
    queryFn: () => unwrap(landLayoutService.get(reservation!.layoutId)),
    enabled: Boolean(reservation),
  });
  const plans = (layout.data?.paymentPlans ?? []).filter((p) => p.active);
  const chosen = plans.find((p) => p.id === planId) ?? null;

  const start = useMutation({
    mutationFn: () => unwrap(landBuyerService.startPurchase(reservation!.id, chosen!.id)),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: buyerLandKeys.all });
      router.push(LAND_BUYER_ROUTES.purchase(purchase.id));
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const close = () => {
    setPlanId(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={Boolean(reservation)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="p-0">
        {reservation && (
          <div className="max-h-[85vh] overflow-y-auto p-5">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Start your purchase
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {plotLabel(reservation)} in {reservation.layoutName} ·{' '}
              {formatCurrency(reservation.price)}. Held for{' '}
              {countdownTo(reservation.expiresAt).label} more. Choose how you will pay.
            </DialogDescription>

            {layout.isLoading ? (
              <div className="mt-4 h-40 animate-pulse rounded-xl bg-secondary" />
            ) : layout.isError ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {layout.error instanceof Error ? layout.error.message : 'Could not load the plans.'}
              </p>
            ) : plans.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                This estate has no active payment plan right now, so a purchase cannot start.
              </p>
            ) : (
              <fieldset className="mt-4 space-y-3">
                <legend className="sr-only">Payment plan</legend>
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`block cursor-pointer rounded-2xl ring-offset-2 ${
                      planId === plan.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="land-plan"
                      value={plan.id}
                      checked={planId === plan.id}
                      onChange={() => setPlanId(plan.id)}
                      className="sr-only"
                    />
                    <PaymentPlanCard
                      plan={plan}
                      quote={
                        layout.data
                          ? quotePlot(reservation.price, layout.data.fees.total, plan)
                          : null
                      }
                    />
                  </label>
                ))}
              </fieldset>
            )}

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={close} disabled={start.isPending}>
                Not now
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  start.mutate();
                }}
                disabled={!chosen || start.isPending}
                isLoading={start.isPending}
              >
                {chosen
                  ? `Start on ${chosen.name}`
                  : plans.length
                    ? 'Choose a plan'
                    : 'Start purchase'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The figures above are the API&apos;s pricing rules applied to this plot; your contract
              fixes the exact schedule when it starts.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
