import { Lock, ShieldCheck, Star } from '@sureground/icons';
import type { ShowroomListing } from '@sureground/shared/showroom';
import { ListingCallToAction } from '@/components/market/ListingCallToAction';
import { COMMERCIAL_VAT_ANCHOR, vatStated } from '@/lib/commercialShowroom';
import { formatCurrency } from '@/lib/format';

const PROTECTION_LINE = {
  rent: 'Pay through Sureground: we hold your rent and release it to the landlord on schedule, unless you raise a dispute.',
  sale: 'Pay through Sureground: we hold your deposit and only release it to the seller once you confirm receipt.',
  land: 'Pay through Sureground: we hold your money and only release it to the seller once the conveyance steps are confirmed.',
} as const;

const PRICE_LABEL = { rent: 'Rent', sale: 'Asking price', land: 'Asking price' } as const;

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export function ShowroomAside({
  listing,
  returnPath,
}: {
  listing: ShowroomListing;
  returnPath: string;
}) {
  const { costs } = listing;
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Price and next steps">
      <div className="space-y-5 overflow-hidden rounded-md border border-border bg-card p-6 shadow-lg shadow-foreground/5">
        {/* A thin brand rule across the top of the card. */}
        <div aria-hidden="true" className="-mx-6 -mt-6 mb-1 h-1 bg-primary" />
        <div>
          <p className="text-sm font-semibold text-primary">{PRICE_LABEL[listing.market]}</p>
          <p className="font-display data-value mt-1 text-[2.25rem] leading-tight font-normal tracking-[-0.015em] text-foreground">
            {formatCurrency(listing.price)}
            {listing.priceUnit && (
              <span className="font-sans text-base font-normal text-muted-foreground">
                /{listing.priceUnit}
              </span>
            )}
          </p>
          {listing.market === 'rent' && listing.priceUnit === 'year' && (
            <p className="mt-1 text-sm text-muted-foreground">
              About {formatCurrency(Math.round(listing.price / 12))} a month
            </p>
          )}
        </div>

        <div id="listing-cta" className="space-y-3">
          <ListingCallToAction
            market={listing.market}
            id={listing.id}
            returnPath={returnPath}
            underOffer={listing.underOffer}
            notAcceptingApplications={listing.notAcceptingApplications}
            title={listing.title}
            commercial={!!listing.commercial}
          />
        </div>

        <section
          aria-labelledby="costs-heading"
          className="rounded-md border border-border bg-secondary/40 p-4 text-sm"
        >
          <h2 id="costs-heading" className="font-semibold text-foreground">
            {listing.market === 'rent' ? 'What you pay to move in' : 'What you pay'}
          </h2>
          <dl className="mt-3 space-y-2">
            {costs.lines.map((line) => (
              <div key={line.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{line.label}</dt>
                <dd className="data-value font-medium text-foreground">
                  {formatCurrency(line.amount)}
                </dd>
              </div>
            ))}
            {costs.total && costs.lines.length > 1 && (
              <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-2">
                <dt className="font-semibold text-foreground">{costs.total.label}</dt>
                <dd className="data-value font-semibold text-foreground">
                  {formatCurrency(costs.total.amount)}
                </dd>
              </div>
            )}
          </dl>
          {vatStated(listing.commercial) && (
            // VAT is never added to these amounts; the landlord's own statement is shown once, up the page.
            <p className="mt-3 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
              Sureground does not add VAT to these amounts.{' '}
              <a
                href={`#${COMMERCIAL_VAT_ANCHOR}`}
                className="font-medium text-primary hover:underline"
              >
                See the VAT the landlord states
              </a>
              .
            </p>
          )}
          {costs.notStated.length > 0 && (
            <p className="mt-3 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
              Not stated in this listing: {list(costs.notStated).toLowerCase()}. Ask for the full
              breakdown before you pay.
            </p>
          )}
        </section>

        {listing.host && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{listing.host.label}</p>
              <p className="truncate font-semibold text-foreground">{listing.host.name}</p>
              {listing.host.rating ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" aria-hidden="true" />
                  {listing.host.rating.toFixed(1)}
                  {listing.host.reviews ? ` · ${listing.host.reviews} reviews` : ''}
                </p>
              ) : null}
            </div>
            {listing.host.verified && (
              <ShieldCheck className="h-5 w-5 text-primary" aria-label="Verified" />
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            {PROTECTION_LINE[listing.market]}
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            Never pay outside Sureground or share sensitive financial details.
          </p>
        </div>
      </div>
    </aside>
  );
}
