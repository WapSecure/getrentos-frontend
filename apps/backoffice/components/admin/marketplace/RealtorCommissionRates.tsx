'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Percent } from 'lucide-react';
import { Button, PageErrorState, Toast } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';

/**
 * The platform's commission split.
 *
 * Two rates, because two realtors can stand on one deal: whoever listed the
 * property and whoever represented the buyer. A side that has no realtor on it
 * is simply not paid, so a zero buyer-side rate is a valid, common setting.
 *
 * This is the *platform* split, not a realtor's own default rate on their
 * business settings: that one only pre-fills their own paperwork.
 */
export const RealtorCommissionRates = () => {
  const client = useQueryClient();
  // The form is a draft that falls back to the stored split, rather than state
  // mirrored from it in an effect: an effect that setState's on every fetch
  // cascades renders, and can briefly show one value while the inputs hold
  // another. `null` means "not edited yet, show what the server says".
  const [draft, setDraft] = useState<{ listing: string; buyer: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'realtor-commission-rates'],
    queryFn: () => unwrap(adminMarketplaceService.getRealtorCommissionRates()),
  });

  const listingSidePct = draft?.listing ?? String(data?.listingSidePct ?? '');
  const buyerSidePct = draft?.buyer ?? String(data?.buyerSidePct ?? '');

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        adminMarketplaceService.setRealtorCommissionRates({
          listingSidePct: Number(listingSidePct),
          buyerSidePct: Number(buyerSidePct),
        })
      ),
    onSuccess: async () => {
      setToast({ message: 'Commission split updated and audited.', variant: 'success' });
      // Drop the draft so the inputs follow the value the server now holds.
      setDraft(null);
      await client.invalidateQueries({ queryKey: ['admin', 'realtor-commission-rates'] });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });

  const total = (Number(listingSidePct) || 0) + (Number(buyerSidePct) || 0);
  const tooMuch = total > 100;
  const bothNumbers = listingSidePct.trim() !== '' && buyerSidePct.trim() !== '';

  if (isError) {
    return (
      <PageErrorState
        title="Could not load the commission split"
        description="The platform commission settings are temporarily unavailable."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
        className="min-h-[220px]"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commission split</h1>
        <p className="mt-1 text-muted-foreground">
          What the platform pays out of a sale that settles, split by which side of the deal a
          realtor stood on.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Rates in force</h2>
        </div>

        {isLoading ? (
          <div className="mt-4 h-24 animate-pulse rounded-lg bg-secondary" />
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-muted-foreground">Listing side (%)</span>
                <input
                  inputMode="numeric"
                  value={listingSidePct}
                  onChange={(e) =>
                    setDraft((d) => ({
                      listing: e.target.value.replace(/[^\d.]/g, ''),
                      buyer: d?.buyer ?? String(data?.buyerSidePct ?? ''),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Paid to the realtor who listed the property
                </span>
              </label>
              <label className="block">
                <span className="text-sm text-muted-foreground">Buyer side (%)</span>
                <input
                  inputMode="numeric"
                  value={buyerSidePct}
                  onChange={(e) =>
                    setDraft((d) => ({
                      buyer: e.target.value.replace(/[^\d.]/g, ''),
                      listing: d?.listing ?? String(data?.listingSidePct ?? ''),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Paid to the realtor who represented the buyer
                </span>
              </label>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Total <span className="font-semibold text-foreground">{total}%</span> of the deal
                value.
                {tooMuch && (
                  <span className="block mt-1 text-red-600 dark:text-red-400">
                    The two sides together cannot exceed 100%: that would pay out more than the sale
                    was worth.
                  </span>
                )}
                <span className="mt-1 block">
                  This applies to sales that settle from now on. Commission already earned keeps the
                  rate it was earned at, so re-pricing never rewrites money already owed.
                </span>
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending || tooMuch || !bothNumbers}
              >
                {save.isPending ? 'Saving…' : 'Save split'}
              </Button>
              {data && (
                <span className="text-xs text-muted-foreground">
                  Currently {data.listingSidePct}% / {data.buyerSidePct}%
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
