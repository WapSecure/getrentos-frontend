'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageLoadingState } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { viewerIsSignedIn } from '@/lib/viewer';
import { getPaymentStatus } from '@/services/paymentStatusService';
import {
  PaymentConfirming,
  PaymentDoneElsewhere,
  PaymentFailed,
  PaymentLookupFailed,
  PaymentNotFound,
  PaymentStillPending,
  PaymentSuccess,
} from '@/components/shared/payments/PaymentReceipt';

const POLL_MS = 2_500;
const GIVE_UP_MS = 60_000;

const noSubscription = () => () => {};

// The query string only finds the reference, never proves payment.
function PaymentReturnContent() {
  const searchParams = useSearchParams();
  // Paystack appends both reference and trxref (older integrations only trxref);
  // Monnify sends paymentReference.
  const reference =
    searchParams.get('reference') ??
    searchParams.get('trxref') ??
    searchParams.get('paymentReference');
  const [gaveUp, setGaveUp] = useState(false);
  const [round, setRound] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [round]);

  // Paid from the mobile app, the in-app browser has no web session. Read on the client only.
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
  if (!reference) return <PaymentNotFound />;
  if (status.isError && !payment) {
    return (
      <PaymentLookupFailed
        reference={reference}
        onRetry={() => status.refetch()}
        retrying={status.isFetching}
      />
    );
  }
  if (!payment || (payment.status === 'PENDING' && !gaveUp)) {
    return <PaymentConfirming kind={payment?.kind} />;
  }
  if (payment.status === 'PAID') return <PaymentSuccess payment={payment} back={back} />;
  if (payment.status === 'FAILED') return <PaymentFailed payment={payment} back={back} />;
  return (
    <PaymentStillPending
      payment={payment}
      back={back}
      checking={status.isFetching}
      onCheckAgain={() => {
        setGaveUp(false);
        setRound((n) => n + 1);
        void status.refetch();
      }}
    />
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <PaymentReturnContent />
    </Suspense>
  );
}
