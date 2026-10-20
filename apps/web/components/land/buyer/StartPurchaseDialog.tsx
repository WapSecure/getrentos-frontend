'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys, landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService, landLayoutService } from '@/services/landBuyerService';
import type { LandReservation } from '@/types/landBuyer';
import { TrustLabelsList } from '../market/TrustLabelsList';
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
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layout = useQuery({
    queryKey: landLayoutKeys.detail(reservation?.layoutId ?? ''),
    queryFn: () => unwrap(landLayoutService.get(reservation!.layoutId)),
    enabled: Boolean(reservation),
  });
  const plans = (layout.data?.paymentPlans ?? []).filter((p) => p.active);
  const chosen = plans.find((p) => p.id === planId) ?? null;
  // What was not verified on the estate's land: the buyer must accept it (US-03).
  const notVerified = layout.data?.notVerified ?? [];
  const needsAcceptance = notVerified.length > 0 && !accepted;

  const start = useMutation({
    mutationFn: () =>
      unwrap(
        landBuyerService.startPurchase(
          reservation!.id,
          chosen!.id,
          notVerified.map((item) => item.key)
        )
      ),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: buyerLandKeys.all });
      router.push(LAND_BUYER_ROUTES.purchase(purchase.id));
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const close = () => {
    setPlanId(null);
    setAccepted(false);
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
              <Skeleton className="mt-4 h-40 rounded-xl" />
            ) : layout.isError && !layout.data ? (
              <Alert variant="danger" className="mt-4">
                {layout.error instanceof Error ? layout.error.message : 'Could not load the plans.'}
              </Alert>
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

            <p className="mt-4 text-sm">
              <Link
                href={`/land/dossier/estate/${reservation.layoutId}?plot=${reservation.plotId}${chosen ? `&plan=${chosen.id}` : ''}`}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                Read the decision dossier and all-in cost
              </Link>{' '}
              <span className="text-muted-foreground">(opens in a new tab)</span>
            </p>

            {notVerified.length > 0 && (
              <Alert
                variant="warning"
                title="Before you commit: what was not verified on this land"
                className="mt-5"
              >
                <div className="mt-2">
                  <TrustLabelsList notVerified={notVerified} />
                </div>
                <Checkbox
                  className="mt-3"
                  checked={accepted}
                  onCheckedChange={setAccepted}
                  label="I have read what was not verified and accept it. I understand I can have my own lawyer check these before I pay."
                />
              </Alert>
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
                disabled={!chosen || needsAcceptance || start.isPending}
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
