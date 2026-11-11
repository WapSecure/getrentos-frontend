'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@sureground/ui';
import { ScanSearch, Video } from '@sureground/icons';
import { RequestTourDialog } from '@/components/shared/tours/RequestTourDialog';
import { RequestInspectionDialog } from '@/components/shared/inspections/RequestInspectionDialog';
import { viewerIsSignedIn } from '@/lib/viewer';
import { track } from '@/lib/analytics';
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

/** For a home for sale: see it on a video call, or send an inspector, before making an offer. */
function SaleVisitActions({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState<'tour' | 'inspection' | null>(null);
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          icon={<Video className="h-4 w-4" />}
          onClick={() => setOpen('tour')}
        >
          Book a video tour
        </Button>
        <Button
          variant="outline"
          icon={<ScanSearch className="h-4 w-4" />}
          onClick={() => setOpen('inspection')}
        >
          Commission an inspection
        </Button>
      </div>
      <RequestTourDialog
        open={open === 'tour'}
        onClose={() => setOpen(null)}
        target={{ listingId: id }}
        placeName={title}
        place="home"
      />
      <RequestInspectionDialog
        open={open === 'inspection'}
        onClose={() => setOpen(null)}
        target={{ listingId: id }}
        placeName={title}
        place="home"
      />
    </>
  );
}

const PRIMARY =
  'flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

// The page is statically rendered, so the session is read after mount.
export function ListingCallToAction({
  market,
  id,
  returnPath,
  underOffer,
  compact = false,
  title,
}: {
  market: PublicDetailMarket;
  id: string;
  returnPath: string;
  underOffer?: boolean;
  compact?: boolean;
  /** The listing's name, for the tour and inspection dialogs. */
  title?: string;
}) {
  const signedIn = useSyncExternalStore(subscribeToNothing, viewerIsSignedIn, () => false);
  const recordStart = () =>
    track({
      name: market === 'rent' ? 'inquiry_start' : 'offer_start',
      listingId: id,
      market,
      surface: compact ? 'sticky_bar' : 'listing_page',
      props: { variant: signedIn ? 'signed_in' : 'signed_out' },
    });

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
      <>
        <Link href={signedInHref(market, id)} className={PRIMARY} onClick={recordStart}>
          {SIGNED_IN[market]}
        </Link>
        {market === 'sale' && !compact && title && <SaleVisitActions id={id} title={title} />}
      </>
    );
  }

  const next = encodeURIComponent(returnPath);
  return (
    <>
      <Link href={`/login?next=${next}`} className={PRIMARY} onClick={recordStart}>
        {SIGNED_OUT[market]}
      </Link>
      {!compact && (
        <Link
          href={`/signup?next=${next}`}
          className="block text-center text-sm font-medium text-primary hover:underline"
        >
          New here? Create a free account
        </Link>
      )}
    </>
  );
}
