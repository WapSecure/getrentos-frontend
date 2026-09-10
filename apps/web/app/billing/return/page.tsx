'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { billingService, type MyBilling } from '@/services/billingService';
import { unwrap } from '@/lib/apiHelpers';
import { useProCheckout } from '@/hooks/useProCheckout';

/**
 * Where the payment gateway returns the customer.
 *
 * The result is confirmed server-side against the gateway — the query string is
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
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This only takes a moment. Please don&apos;t close this page.
          </p>
        </>
      )}

      {view.status === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">You&apos;re on Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view.detail?.trialEndsAt
              ? `Your free trial runs until ${new Date(view.detail.trialEndsAt).toLocaleDateString()}. We'll only charge you after that — cancel any time before then.`
              : 'Your Pro plan is active.'}
          </p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Back to GetRentos
          </Link>
        </>
      )}

      {view.status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            We couldn&apos;t confirm that payment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view.message} If you were charged, your plan will be activated automatically — you
            don&apos;t need to pay again.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Back to GetRentos
          </Link>
        </>
      )}
    </div>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <BillingReturnContent />
    </Suspense>
  );
}
