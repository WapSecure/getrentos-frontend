'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageLoadingState } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { viewerIsSignedIn } from '@/lib/viewer';
import { getPaymentStatus } from '@/services/paymentStatusService';
import {
  PaymentConfirming,
  PaymentDoneElsewhere,
  PaymentFailed,
  PaymentNotFound,
  PaymentStillPending,
  PaymentSuccess,
} from '@/components/shared/payments/PaymentReceipt';

/** How often the page asks while a payment is unconfirmed, and for how long before it stops asking. */
const POLL_MS = 2_500;
const GIVE_UP_MS = 60_000;

/** Sign-in state does not change while this page is open. */
const noSubscription = () => () => {};

/**
 * Where Paystack or Monnify sends every payer back to (rent, deposits, bookings, land,
 * Flex, dues; Pro has its own page).
 *
 * The outcome comes from GetRentos's records via the status endpoint, which
 * also asks the payment company directly while a payment is pending. The query string is
 * only used to find the reference, never as proof of payment.
 */
function PaymentReturnContent() {
  const searchParams = useSearchParams();
  // Paystack appends both reference and trxref (older integrations only trxref);
  // Monnify sends paymentReference.
  const reference =
    searchParams.get('reference') ??
    searchParams.get('trxref') ??
    searchParams.get('paymentReference');
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

  if (!signedIn) return <PaymentDoneElsewhere />;
  if (!reference || status.isError) return <PaymentNotFound />;
  if (!payment || (payment.status === 'PENDING' && !gaveUp)) {
    return <PaymentConfirming kind={payment?.kind} />;
  }
  if (payment.status === 'PAID') return <PaymentSuccess payment={payment} back={back} />;
  if (payment.status === 'FAILED') return <PaymentFailed payment={payment} back={back} />;
  return <PaymentStillPending payment={payment} back={back} />;
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <PaymentReturnContent />
    </Suspense>
  );
}
