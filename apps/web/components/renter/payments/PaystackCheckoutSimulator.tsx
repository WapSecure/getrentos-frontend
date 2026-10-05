'use client';

import { useState } from 'react';
import { Lock, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';

/**
 * A stand-in for Paystack's hosted checkout, for local development only, until
 * real Paystack keys are configured. It mirrors the real flow's shape — a
 * checkout step the person confirms before the charge settles — so the actual
 * payment still runs through the normal `payNow` → escrow-hold path underneath.
 *
 * When real Paystack keys are present the backend returns an `authorizationUrl`
 * and the app redirects to the genuine hosted page instead; this never shows.
 */
interface PaystackCheckoutSimulatorProps {
  open: boolean;
  amount: number;
  email: string;
  /** Called when the person confirms payment on the simulated checkout. */
  onConfirm: () => void;
  onClose: () => void;
}

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const PaystackCheckoutSimulator = ({
  open,
  amount,
  email,
  onConfirm,
  onClose,
}: PaystackCheckoutSimulatorProps) => {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // A short pause so the simulated checkout reads like a real redirect round-trip.
    setTimeout(() => {
      setProcessing(false);
      onConfirm();
    }, 900);
  };

  const handleClose = () => {
    if (processing) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-w-sm overflow-hidden p-0">
        <div className="flex items-center justify-between bg-[#0ba4db] px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Paystack</span>
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Test mode
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            aria-label="Close"
            className="rounded p-1 text-white/90 hover:bg-white/15 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <DialogTitle className="text-base font-semibold text-foreground">
            Pay {naira(amount)}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            {email} · GetRentos
          </DialogDescription>

          <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Simulated checkout (dev)</p>
            <p className="mt-1">
              No real card is charged. This stands in for Paystack&apos;s hosted page until live
              keys are configured, then the real checkout takes over automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={processing}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0ba4db] text-sm font-semibold text-white transition-colors hover:bg-[#0a93c4] disabled:opacity-70"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>Pay {naira(amount)}</>
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="mt-2 w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel payment
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secured by GetRentos Payment Protection
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Whether to show the simulated checkout. On by default outside production so
 * local dev has a visible gateway step with no keys; force with
 * `NEXT_PUBLIC_SIMULATE_PAYSTACK=true` or disable with `=false`.
 */
export const shouldSimulatePaystack = (): boolean => {
  const flag = process.env.NEXT_PUBLIC_SIMULATE_PAYSTACK;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};
