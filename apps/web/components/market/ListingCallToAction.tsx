'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { viewerIsSignedIn } from '@/lib/viewer';
import type { PublicDetailMarket } from '@/lib/publicListingDetail';

const SIGNED_OUT: Record<PublicDetailMarket, string> = {
  rent: 'Sign in to enquire',
  sale: 'Sign in to make an offer',
  land: 'Sign in to make an offer',
};

const SIGNED_IN: Record<PublicDetailMarket, string> = {
  rent: 'Enquire about this home',
  sale: 'Make an offer',
  land: 'Make an offer',
};

const signedInHref = (market: PublicDetailMarket, id: string) =>
  market === 'rent'
    ? `/renter/properties/${id}`
    : `/buyer/offers?property=${encodeURIComponent(id)}`;

const subscribeToNothing = () => () => {};

const PRIMARY =
  'flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

/**
 * The detail page's call to action. The page is statically rendered, so the
 * session is read after mount: signed-in viewers go straight to the offer or
 * enquiry instead of being asked to sign in again. A listing under offer takes
 * no new offers, so it says so instead.
 */
export function ListingCallToAction({
  market,
  id,
  returnPath,
  underOffer,
}: {
  market: PublicDetailMarket;
  id: string;
  returnPath: string;
  underOffer?: boolean;
}) {
  // False on the server and during hydration, then the stored session.
  const signedIn = useSyncExternalStore(subscribeToNothing, viewerIsSignedIn, () => false);

  if (underOffer) {
    return (
      <div className="rounded-xl border border-warning/40 bg-warning-subtle p-3 text-sm text-foreground">
        <p className="font-semibold">Under offer</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          The seller has accepted an offer on this property, so it is not taking new offers right
          now.
        </p>
      </div>
    );
  }

  if (signedIn) {
    return (
      <Link href={signedInHref(market, id)} className={PRIMARY}>
        {SIGNED_IN[market]}
      </Link>
    );
  }

  const next = encodeURIComponent(returnPath);
  return (
    <>
      <Link href={`/login?next=${next}`} className={PRIMARY}>
        {SIGNED_OUT[market]}
      </Link>
      <Link
        href={`/signup?next=${next}`}
        className="block text-center text-sm font-medium text-primary hover:underline"
      >
        New here? Create a free account
      </Link>
    </>
  );
}
