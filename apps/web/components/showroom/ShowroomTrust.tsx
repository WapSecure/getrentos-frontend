import { BadgeCheck, Camera, Info, ShieldCheck, Video } from '@sureground/icons';
import type { ShowroomListing } from '@sureground/shared/showroom';
import { VerificationSummaryCard } from '@/components/shared/trust/VerificationSummaryCard';
import { PropertyTrustChain } from '@/components/renter/property-detail/PropertyTrustChain';

const month = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

export function ShowroomTrust({ listing }: { listing: ShowroomListing }) {
  const filmed = listing.media.find((m) => m.kind === 'video' && m.filmedOnSite);
  const photoCount = listing.media.filter((m) => m.kind === 'image').length;
  const summary = listing.verificationSummary;
  const chain = listing.trustChain;

  return (
    <section aria-labelledby="trust" className="border-t border-border/70 pt-8">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h2
          id="trust"
          className="font-display text-[1.625rem] leading-tight font-normal tracking-[-0.01em] text-foreground sm:text-[1.875rem]"
        >
          What has been checked
        </h2>
      </div>
      {/* The chain is what the header badge and the browse card read from, step by step. */}
      {chain && (
        <div className="mt-4">
          <PropertyTrustChain property={{ trustChain: chain }} />
        </div>
      )}
      {/* The summary replaces the single verified row: it says what was checked rather than "verified". */}
      {summary && (
        <div className="mt-4">
          <VerificationSummaryCard summary={summary} />
        </div>
      )}
      <ul className="mt-4 space-y-3 text-sm">
        {/* The bare flag is only the fallback, where the API sends neither a chain nor a summary. */}
        {!summary && !chain && (
          <li className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
            {listing.verified ? (
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {listing.verified
                  ? listing.market === 'land'
                    ? 'Ownership verified by Sureground'
                    : 'Verified by Sureground'
                  : 'Not verified yet'}
              </p>
              <p className="mt-1 text-muted-foreground">
                {listing.verified
                  ? 'We reviewed the ownership records for this listing. That is not a guarantee that a sale or tenancy is legally sound, so complete your own checks before you pay.'
                  : 'We have not reviewed the ownership records for this listing yet. Take extra care, and only pay through Sureground.'}
              </p>
            </div>
          </li>
        )}
        {filmed && (
          <li className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
            <Video className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">Video filmed on site</p>
              <p className="mt-1 text-muted-foreground">
                The video tour was recorded at the property
                {filmed.capturedAt ? ` in ${month(filmed.capturedAt)}` : ''}, so it shows the real
                place rather than stock footage.
              </p>
            </div>
          </li>
        )}
        {photoCount > 0 && (
          <li className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
            <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">Photos supplied by the lister</p>
              <p className="mt-1 text-muted-foreground">
                They may not show the current condition. Ask for a viewing before you commit.
              </p>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}
