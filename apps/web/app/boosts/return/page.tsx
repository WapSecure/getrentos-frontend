'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from '@sureground/icons';
import { Button, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { boostService, type BoostSummary } from '@/services/boostService';
import { BOOST_RETURN_KEY } from '@/components/shared/boosts/BoostListingDialog';

const MAX_TRIES = 5;

function returnPath(): string {
  try {
    const saved = sessionStorage.getItem(BOOST_RETURN_KEY);
    return saved && saved.startsWith('/') && !saved.startsWith('//') ? saved : '/';
  } catch {
    return '/';
  }
}

// The query string only finds the reference; the server confirms payment with the provider.
function BoostReturnContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');
  const [state, setState] = useState<{
    status: 'pending' | 'paid' | 'failed' | 'waiting';
    summary?: BoostSummary;
  }>({ status: 'pending' });
  const router = useRouter();
  const goBack = () => router.push(returnPath());

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < MAX_TRIES && !cancelled; attempt++) {
        try {
          const result = await unwrap(boostService.verify(reference));
          if (result.status !== 'PENDING') {
            if (!cancelled) {
              setState({
                status: result.status === 'PAID' ? 'paid' : 'failed',
                summary: result.summary,
              });
            }
            return;
          }
        } catch {
          // Retried below; a lasting failure ends as "waiting".
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (!cancelled) setState({ status: 'waiting' });
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const status = reference ? state.status : 'failed';
  const left = state.summary ? state.summary.includedLeft + state.summary.purchasedLeft : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {status === 'pending' && (
        <div role="status" aria-live="polite" className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This only takes a moment. Please don&apos;t close this page.
          </p>
        </div>
      )}
      {status === 'paid' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-success" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Your boosts are ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {left !== null
              ? `You have ${left} boost${left === 1 ? '' : 's'} to use. Open a published listing and choose Boost.`
              : 'Open a published listing and choose Boost.'}
          </p>
          <Button onClick={goBack} className="mt-6">
            Back to your listings
          </Button>
        </>
      )}
      {status === 'waiting' && (
        <>
          <Loader2 className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Still confirming</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your bank hasn&apos;t confirmed the payment yet. Your boosts will appear as soon as it
            does: you don&apos;t need to pay again.
          </p>
          <Button onClick={goBack} variant="outline" className="mt-6">
            Back to your listings
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
            {reference
              ? 'The payment was not completed. If you were charged, your boosts will appear automatically: you don’t need to pay again.'
              : 'No payment reference was provided.'}
          </p>
          <Button onClick={goBack} variant="outline" className="mt-6">
            Back to your listings
          </Button>
        </>
      )}
    </div>
  );
}

export default function BoostReturnPage() {
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
      <BoostReturnContent />
    </Suspense>
  );
}
