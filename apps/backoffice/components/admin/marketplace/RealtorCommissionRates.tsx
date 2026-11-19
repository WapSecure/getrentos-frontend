'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Percent } from '@sureground/icons';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  Field,
  NumberInput,
  PageErrorState,
  Skeleton,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';

// The platform split, not a realtor's own default rate; a zero buyer-side rate is valid, since a side with no realtor isn't paid.
export const RealtorCommissionRates = () => {
  const client = useQueryClient();
  // A draft over the stored split rather than state synced in an effect, which would cascade renders; `null` means not edited yet.
  const [draft, setDraft] = useState<{ listing: string; buyer: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const toast = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'realtor-commission-rates'],
    queryFn: () => unwrap(adminMarketplaceService.getRealtorCommissionRates()),
  });

  const listingSidePct = draft?.listing ?? String(data?.listingSidePct ?? '');
  const buyerSidePct = draft?.buyer ?? String(data?.buyerSidePct ?? '');

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        adminMarketplaceService.setRealtorCommissionRates(
          { listingSidePct: Number(listingSidePct), buyerSidePct: Number(buyerSidePct) },
          reason.trim()
        )
      ),
    onSuccess: async () => {
      toast.info(
        'Sent for approval. The new split applies once another officer approves it under Approvals.'
      );
      setDraft(null);
      setReason('');
      setConfirmOpen(false);
      await client.invalidateQueries({ queryKey: ['admin', 'realtor-commission-rates'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const total = (Number(listingSidePct) || 0) + (Number(buyerSidePct) || 0);
  const tooMuch = total > 100;
  const bothNumbers = listingSidePct.trim() !== '' && buyerSidePct.trim() !== '';

  if (isError && !data) {
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
      <PageHeader
        title="Commission split"
        description="What the platform pays out of a sale that settles, split by which side of the deal a realtor stood on."
      />

      <Card className="max-w-xl p-5">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Rates in force</h2>
        </div>

        {isLoading ? (
          <div
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
            role="status"
            aria-label="Loading"
          >
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Listing side (%)"
                hint="Whole percent, paid to the realtor who listed the property"
              >
                <NumberInput
                  value={listingSidePct}
                  onValueChange={(value) =>
                    setDraft((d) => ({
                      listing: value,
                      buyer: d?.buyer ?? String(data?.buyerSidePct ?? ''),
                    }))
                  }
                />
              </Field>
              <Field
                label="Buyer side (%)"
                hint="Whole percent, paid to the realtor who represented the buyer"
              >
                <NumberInput
                  value={buyerSidePct}
                  onValueChange={(value) =>
                    setDraft((d) => ({
                      buyer: value,
                      listing: d?.listing ?? String(data?.listingSidePct ?? ''),
                    }))
                  }
                />
              </Field>
            </div>

            <Alert variant={tooMuch ? 'danger' : 'neutral'} icon={Info} className="mt-4">
              <p>
                Total <span className="font-semibold text-foreground">{total}%</span> of the deal
                value.
                {tooMuch && (
                  <span className="block mt-1 text-destructive">
                    The two sides together cannot exceed 100%: that would pay out more than the sale
                    was worth.
                  </span>
                )}
                <span className="mt-1 block">
                  This applies to sales that settle from now on. Commission already earned keeps the
                  rate it was earned at, so re-pricing never rewrites money already owed.
                </span>
              </p>
            </Alert>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={tooMuch || !bothNumbers || draft === null}
                isLoading={save.isPending}
                loadingText="Sending…"
              >
                Ask for approval
              </Button>
              {data && (
                <span className="text-xs text-muted-foreground">
                  Currently {data.listingSidePct}% / {data.buyerSidePct}%
                </span>
              )}
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setReason('');
        }}
        title="Ask for this commission change?"
        description={`Listing side ${listingSidePct}%, buyer side ${buyerSidePct}%. Another officer must approve it before it applies to sales that settle.`}
        confirmLabel="Send for approval"
        tone="primary"
        promptLabel="Reason"
        promptPlaceholder="Why the split should change"
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired
        promptMinLength={10}
        isLoading={save.isPending}
        onConfirm={() => save.mutate()}
      />
    </div>
  );
};
