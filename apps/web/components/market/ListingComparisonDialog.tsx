'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BadgeCheck, Check, Minus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { PublicListingCard, PublicMarket } from '@/services/publicMarketService';

const value = (content: ReactNode) =>
  content ?? <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-label="Not provided" />;

export function ListingComparisonDialog({
  open,
  market,
  listings,
  onOpenChange,
  onRemove,
}: {
  open: boolean;
  market: PublicMarket;
  listings: PublicListingCard[];
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const detailPath = market === 'rent' ? '/rent' : '/buy';
  const rows: { label: string; render: (listing: PublicListingCard) => ReactNode }[] = [
    {
      label: 'Price',
      render: (listing) => (
        <span className="font-bold text-foreground">
          {formatCurrency(listing.price)}
          {listing.priceUnit ? (
            <span className="block text-xs font-normal text-muted-foreground">
              per {listing.priceUnit}
            </span>
          ) : null}
        </span>
      ),
    },
    { label: 'Location', render: (listing) => listing.location },
    { label: 'Bedrooms', render: (listing) => value(listing.bedrooms) },
    { label: 'Bathrooms', render: (listing) => value(listing.bathrooms) },
    { label: 'Size', render: (listing) => value(listing.size ? `${listing.size} m²` : null) },
    { label: 'Property type', render: (listing) => value(listing.propertyType) },
    {
      label: 'Verification',
      render: (listing) =>
        listing.verified ? (
          <span className="inline-flex items-center gap-1 font-semibold text-success">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verified
          </span>
        ) : (
          <span className="text-muted-foreground">Not verified</span>
        ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0">
        <div className="border-b border-border px-6 py-5 pr-14">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Compare listings
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Review the details that matter before opening each listing.
          </DialogDescription>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-36 border-b border-border p-3 text-left text-muted-foreground">
                  Feature
                </th>
                {listings.map((listing) => (
                  <th key={listing.id} className="border-b border-border p-3 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 font-semibold text-foreground">
                        {listing.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(listing.id)}
                        aria-label={`Remove ${listing.title} from comparison`}
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th className="border-b border-border/70 bg-muted/30 p-3 text-left font-medium text-muted-foreground">
                    {row.label}
                  </th>
                  {listings.map((listing) => (
                    <td
                      key={listing.id}
                      className="border-b border-border/70 p-3 text-center text-foreground"
                    >
                      {row.render(listing)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th className="p-3 text-left text-muted-foreground">Next step</th>
                {listings.map((listing) => (
                  <td key={listing.id} className="p-3 text-center">
                    <Link
                      href={`${detailPath}/${listing.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      View listing
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="flex items-start gap-2 border-t border-border bg-muted/20 px-6 py-4 text-xs text-muted-foreground">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
          Comparison uses information supplied with each listing. Confirm all details before making
          a payment or offer.
        </p>
      </DialogContent>
    </Dialog>
  );
}
