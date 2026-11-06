'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { Button, EmptyState, PageLoadingState } from '@getrentos/ui';
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
  VENDOR_TOP_UP: 'top-up for the vendor invoice',
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      {!signedIn ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're done here"
          description="Close this page and go back to GetRentos. Your payment shows there as soon as it's confirmed: you don't need to pay again."
        />
      ) : !reference || status.isError ? (
        <EmptyState
          icon={XCircle}
          title="We couldn't find that payment"
          description="If you were charged, it will show on your account once it's confirmed: you don't need to pay again."
          action={
            <Button href="/" variant="outline">
              Back to GetRentos
            </Button>
          }
        />
      ) : !payment || (payment.status === 'PENDING' && !gaveUp) ? (
        <EmptyState
          icon={Loader2}
          title={`Confirming your ${what}…`}
          description="This usually takes a few seconds. You can leave this page; it won't affect the payment."
        />
      ) : payment.status === 'PAID' ? (
        <EmptyState
          icon={CheckCircle2}
          title={`${formatCurrency(payment.amount)} paid`}
          description={`Your ${what} is confirmed. Reference ${payment.reference}.`}
          action={<Button href={back}>Done</Button>}
        />
      ) : payment.status === 'FAILED' ? (
        <EmptyState
          icon={XCircle}
          title="This payment didn't go through"
          description="Nothing was taken for this attempt. You can try again from where you started."
          action={<Button href={back}>Try again</Button>}
        />
      ) : (
        <EmptyState
          icon={Clock}
          title="Still confirming"
          description={`Your bank hasn't confirmed this ${what} yet. If you were charged, it will show as paid automatically and we'll let you know: you don't need to pay again.`}
          action={
            <Button href={back} variant="outline">
              Back to GetRentos
            </Button>
          }
        />
      )}
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <PaymentReturnContent />
    </Suspense>
  );
}
