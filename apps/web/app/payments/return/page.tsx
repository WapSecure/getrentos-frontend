'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { Button, Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { paymentKeys } from '@/lib/queryKeys';
import { viewerIsSignedIn } from '@/lib/viewer';
import { getPaymentStatus } from '@/services/paymentStatusService';
import type { PaymentKind } from '@/types/payments';

/** How often the page asks while a payment is unconfirmed, and for how long before it stops asking. */
const POLL_MS = 2_500;
const GIVE_UP_MS = 60_000;

const WHAT: Record<PaymentKind, string> = {
  RENT: 'rent payment',
  ESCROW: 'deposit',
  SHORTLET: 'booking payment',
  LAND: 'land payment',
  FLEX: 'installment',
  DUE: 'dues payment',
};

/** Sign-in state does not change while this page is open. */
const noSubscription = () => () => {};

/**
 * Where Paystack sends every payer back to (rent, deposits, bookings, land,
 * Flex, dues; Pro has its own page).
 *
 * The outcome comes from GetRentos's records via the status endpoint, which
 * also asks Paystack directly while a payment is pending. The query string is
 * only used to find the reference, never as proof of payment.
 */
function PaymentReturnContent() {
  const searchParams = useSearchParams();
  // Paystack appends both; older integrations only send trxref.
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');
  // After a minute the page stops asking and says so, rather than spinning on.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, []);

  // Paid from the mobile app, the payer lands here in an in-app browser with no
  // web session: there is nothing to look up, and the app shows the outcome.
  // Read on the client only; the server render assumes a session.
  const signedIn = useSyncExternalStore(noSubscription, viewerIsSignedIn, () => true);

  const status = useQuery({
    queryKey: paymentKeys.status(reference ?? ''),
    queryFn: () => unwrap(getPaymentStatus(reference as string)),
    enabled: Boolean(reference) && signedIn,
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' && !gaveUp ? POLL_MS : false,
    retry: 2,
  });

  const payment = status.data;
  const back = payment?.returnPath ?? '/';
  const what = payment ? WHAT[payment.kind] : 'payment';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {!signedIn ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-foreground">You&apos;re done here</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Close this page and go back to GetRentos. Your payment shows there as soon as it&apos;s
            confirmed: you don&apos;t need to pay again.
          </p>
        </>
      ) : !reference || status.isError ? (
        <>
          <XCircle className="h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            We couldn&apos;t find that payment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If you were charged, it will show on your account once it&apos;s confirmed: you
            don&apos;t need to pay again.
          </p>
          <Button href="/" variant="outline" className="mt-6">
            Back to GetRentos
          </Button>
        </>
      ) : !payment || (payment.status === 'PENDING' && !gaveUp) ? (
        <div role="status" aria-live="polite" className="flex flex-col items-center">
          <Loader2
            className="h-10 w-10 animate-spin text-primary motion-reduce:animate-none"
            aria-hidden
          />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Confirming your {what}…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This usually takes a few seconds. You can leave this page; it won&apos;t affect the
            payment.
          </p>
        </div>
      ) : payment.status === 'PAID' ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            {formatCurrency(payment.amount)} paid
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your {what} is confirmed. Reference{' '}
            <span className="font-mono text-foreground">{payment.reference}</span>
          </p>
          <Button href={back} className="mt-6">
            Done
          </Button>
        </>
      ) : payment.status === 'FAILED' ? (
        <>
          <XCircle className="h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            This payment didn&apos;t go through
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing was taken for this attempt. You can try again from where you started.
          </p>
          <Button href={back} className="mt-6">
            Try again
          </Button>
        </>
      ) : (
        <>
          <Clock className="h-12 w-12 text-warning" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Still confirming</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your bank hasn&apos;t confirmed this {what} yet. If you were charged, it will show as
            paid automatically and we&apos;ll let you know: you don&apos;t need to pay again.
          </p>
          <Button href={back} variant="outline" className="mt-6">
            Back to GetRentos
          </Button>
        </>
      )}
    </div>
  );
}

export default function PaymentReturnPage() {
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
      <PaymentReturnContent />
    </Suspense>
  );
}
