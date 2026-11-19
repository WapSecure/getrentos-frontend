'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from '@sureground/icons';
import { Button, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { estateKeys } from '@/lib/queryKeys';
import { estatePlanService, type EstateProBilling } from '@/services/estatePlanService';

const MAX_TRIES = 5;

// The query string only finds the checkout; the server confirms the payment with Paystack.
function EstateProReturnContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const estateId = searchParams.get('estate');
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');
  const [state, setState] = useState<{
    status: 'pending' | 'ok' | 'waiting' | 'failed';
    billing?: EstateProBilling;
    message?: string;
  }>({
    status: 'pending',
  });

  useEffect(() => {
    if (!estateId || !reference) return;
    let cancelled = false;
    (async () => {
      let lastError: string | undefined;
      for (let attempt = 0; attempt < MAX_TRIES && !cancelled; attempt++) {
        try {
          const billing = await unwrap(estatePlanService.verify(estateId, reference));
          if (billing.inForce) {
            void queryClient.invalidateQueries({ queryKey: estateKeys.myEstates });
            void queryClient.invalidateQueries({ queryKey: ['estate', estateId, 'plan'] });
            if (!cancelled) setState({ status: 'ok', billing });
            return;
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : undefined;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (!cancelled)
        setState(lastError ? { status: 'failed', message: lastError } : { status: 'waiting' });
    })();
    return () => {
      cancelled = true;
    };
  }, [estateId, reference, queryClient]);

  const status = estateId && reference ? state.status : 'failed';
  const b = state.billing;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {status === 'pending' && (
        <div role="status" aria-live="polite" className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This only takes a moment. Please don&apos;t close this page.
          </p>
        </div>
      )}
      {status === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-success" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            {b?.status === 'TRIALING'
              ? 'Your Estate Pro trial has started'
              : 'This estate is on Estate Pro'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {b?.status === 'TRIALING' && b.trialEndsAt
              ? `It's free until ${formatDate(b.trialEndsAt)}. The small card check is refunded.`
              : 'Pro tools are on for this estate.'}
          </p>
          <Button href="/estate/billing" className="mt-6">
            Back to billing
          </Button>
        </>
      )}
      {status === 'waiting' && (
        <>
          <Loader2 className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Still confirming</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your bank hasn&apos;t confirmed the payment yet. Estate Pro will switch on as soon as it
            does: you don&apos;t need to pay again.
          </p>
          <Button href="/estate/billing" variant="outline" className="mt-6">
            Back to billing
          </Button>
        </>
      )}
      {status === 'failed' && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            We couldn&apos;t confirm that payment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {estateId && reference
              ? `${state.message ?? 'The payment was not completed.'} If you were charged, Estate Pro will switch on automatically: you don't need to pay again.`
              : 'No payment reference was provided.'}
          </p>
          <Button href="/estate/billing" variant="outline" className="mt-6">
            Back to billing
          </Button>
        </>
      )}
    </div>
  );
}

export default function EstateProReturnPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading"
          className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="mt-4 h-6 w-2/3" />
        </div>
      }
    >
      <EstateProReturnContent />
    </Suspense>
  );
}
