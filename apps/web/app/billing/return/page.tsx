'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { billingService, type MyBilling } from '@/services/billingService';
import { unwrap } from '@/lib/apiHelpers';
import { useProCheckout } from '@/hooks/useProCheckout';
import { Button, Skeleton } from '@getrentos/ui';

/**
 * Where the payment gateway returns the customer.
 *
 * The result is confirmed server-side against the gateway: the query string is
 * only used to find the reference, never as proof of payment.
 */
function BillingReturnContent() {
  const searchParams = useSearchParams();
  // Paystack appends both; older integrations only send trxref.
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');
  const { refresh } = useProCheckout();

  const [state, setState] = useState<{
    status: 'pending' | 'ok' | 'error';
    detail?: MyBilling;
    message?: string;
  }>({ status: 'pending' });

  // Derived rather than written into state: a missing reference is a fact about
  // the URL, not something the effect needs to synchronise.
  const view = reference
    ? state
    : { status: 'error' as const, message: 'No payment reference was provided.' };

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;
    (async () => {
      try {
        const billing = await unwrap(billingService.verifyCheckout(reference));
        await refresh();
        if (!cancelled) setState({ status: 'ok', detail: billing });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'We could not confirm your payment.',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, refresh]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {view.status === 'pending' && (
        <div role="status" aria-live="polite" className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This only takes a moment. Please don&apos;t close this page.
          </p>
        </div>
      )}

      {view.status === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-success" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">You&apos;re on Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view.detail?.trialEndsAt
              ? `Your free trial runs until ${new Date(view.detail.trialEndsAt).toLocaleDateString()}. We'll only charge you after that: cancel any time before then.`
              : 'Your Pro plan is active.'}
          </p>
          <Button href="/" className="mt-6">
            Back to GetRentos
          </Button>
        </>
      )}

      {view.status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            We couldn&apos;t confirm that payment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view.message} If you were charged, your plan will be activated automatically: you
            don&apos;t need to pay again.
          </p>
          <Button href="/" variant="outline" className="mt-6">
            Back to GetRentos
          </Button>
        </>
      )}
    </div>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading"
          className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="mt-4 h-6 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
      }
    >
      <BillingReturnContent />
    </Suspense>
  );
}
