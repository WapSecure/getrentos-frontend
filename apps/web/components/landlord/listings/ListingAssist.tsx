'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Info, Sparkles } from 'lucide-react';
import { Button, Card, useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import type { ListingDraft } from '@/types/listingDraft';

/**
 * "Draft it for me": fills the title and amenities from the unit's property and
 * photos. Nothing is saved; the landlord edits and publishes as usual.
 */
export function DraftAssist({
  unitId,
  onApply,
}: {
  unitId: string;
  onApply: (draft: { title: string; amenities: string[] }) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const run = useMutation({
    mutationFn: () => unwrap(landlordService.draftListing(unitId)),
    onSuccess: (d) => {
      setDraft(d);
      onApply({ title: d.title, amenities: d.amenities.map((a) => a.name) });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not draft this listing.'),
  });

  return (
    <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Let us draft the title and amenities from this unit&apos;s photos and details.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={() => run.mutate()}
          isLoading={run.isPending}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Draft it for me
        </Button>
      </div>
      {draft && (
        <div className="space-y-1.5 text-xs" aria-live="polite">
          <p className="text-foreground">
            <Check className="mr-1 inline h-3 w-3 text-success" aria-hidden="true" />
            Title and amenities filled in
            {draft.photosUsed ? ` from ${draft.photosUsed} photos and the description` : ''}. Edit
            anything before publishing.
          </p>
          {draft.amenities.map((a) => (
            <p key={a.name} className="text-muted-foreground">
              {a.name}: {a.why}
            </p>
          ))}
          {draft.price.typicalPerYear && (
            <p className="text-muted-foreground">
              Similar homes: typically {draft.price.typicalPerYear} a year
              {draft.price.typicalRange
                ? ` (most between ${draft.price.typicalRange.low} and ${draft.price.typicalRange.high})`
                : ''}
              , from {draft.price.similarHomes} listings.
            </p>
          )}
          {draft.descriptionSuggestion && (
            <details>
              <summary className="cursor-pointer text-foreground">
                A fuller property description you could use
              </summary>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">
                {draft.descriptionSuggestion}
              </p>
              <p className="mt-1 text-muted-foreground">
                Update it on the property page; it is not changed for you.
              </p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/** "Before you publish": the self-check, re-run a moment after the landlord stops typing. */
export function SelfCheckPanel({
  unitId,
  listingTitle,
  askingRent,
  rentPeriod,
}: {
  unitId: string;
  listingTitle: string;
  askingRent: number;
  rentPeriod: 'year' | 'month';
}) {
  const [inputs, setInputs] = useState({ unitId, listingTitle, askingRent, rentPeriod });
  useEffect(() => {
    const t = setTimeout(() => setInputs({ unitId, listingTitle, askingRent, rentPeriod }), 600);
    return () => clearTimeout(t);
  }, [unitId, listingTitle, askingRent, rentPeriod]);

  const ready = Boolean(inputs.unitId && inputs.listingTitle.trim() && inputs.askingRent > 0);
  const { data } = useQuery({
    queryKey: landlordKeys.listingSelfCheck(inputs),
    queryFn: () => unwrap(landlordService.selfCheckListing(inputs)),
    enabled: ready,
    staleTime: 60_000,
  });
  if (!ready || !data) return null;

  return (
    <Card static aria-labelledby="self-check-title" className="space-y-1.5 p-3">
      <h3 id="self-check-title" className="text-xs font-semibold text-foreground">
        Before you publish
      </h3>
      {data.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          <Check className="mr-1 inline h-3 w-3 text-success" aria-hidden="true" />
          Nothing to fix. Clear listings with real photos let faster.
        </p>
      ) : (
        <ul className="space-y-1">
          {data.items.map((item) => (
            <li key={item.key} className="flex gap-1.5 text-xs">
              {item.level === 'fix' ? (
                <AlertTriangle
                  className="mt-0.5 h-3 w-3 shrink-0 text-warning"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <span className="text-foreground">{item.message}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
