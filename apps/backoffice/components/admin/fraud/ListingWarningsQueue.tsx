'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScanSearch } from '@sureground/icons';
import { Badge, Button, ConfirmDialog, Skeleton, useToast } from '@sureground/ui';
import { cn, formatDate, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { ListingWarningDecision, ListingWarningQueueItem } from '@/types/admin';

type PendingDecision = { item: ListingWarningQueueItem; decision: ListingWarningDecision };

const DECISION_COPY: Record<
  ListingWarningDecision,
  { title: string; description: string; label: string; tone: 'danger' | 'primary'; toast: string }
> = {
  clear: {
    title: 'Clear this warning as a false alarm?',
    description:
      'Renters will stop seeing it on the listing, and it will no longer hold up the property’s verification. It stays in the audit log.',
    label: 'Clear warning',
    tone: 'primary',
    toast: 'Warning cleared.',
  },
  uphold: {
    title: 'Uphold this warning?',
    description:
      'Renters will keep seeing it on the listing. It will no longer hold up the property’s verification, so decide that separately. Nothing is rejected or hidden automatically.',
    label: 'Uphold warning',
    tone: 'danger',
    toast: 'Warning upheld.',
  },
};

const noSubscription = () => () => {};

/** The deep link from a verification review: /admin/fraud?warning=<reviewId>. */
function linkedWarningId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('warning');
}

/**
 * Automated listing warnings nobody has decided yet. A property cannot be verified while one is open,
 * and one that arrives after verification is shown here rather than sitting silently beside "verified".
 */
export function ListingWarningsQueue({ onOpenAlert }: { onOpenAlert: (alertId: string) => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  // Read after hydration only, so the server and first client render agree.
  const linkedId = useSyncExternalStore(noSubscription, linkedWarningId, () => null);
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.listingWarnings,
    queryFn: () => unwrap(adminService.listListingWarnings()),
  });
  // A list, or nothing to show: never let an unexpected payload break the whole fraud page.
  const items = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (!linkedId || !Array.isArray(data) || !data.some((item) => item.reviewId === linkedId))
      return;
    document
      .getElementById(`listing-warning-${linkedId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [linkedId, data]);

  const decideMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: ({ item, decision }: PendingDecision) =>
      unwrap(adminService.decideListingWarning(item.reviewId, decision, note)),
    onSuccess: (_result, { decision }) => {
      toast.success(DECISION_COPY[decision].toast);
      void queryClient.invalidateQueries({ queryKey: adminKeys.listingWarnings });
      // The verification review screen holds approval on these.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    },
  });

  // Nothing to decide and nothing went wrong: the section stays out of the way.
  if (!isLoading && !isError && items.length === 0) return null;

  return (
    <section
      id="listing-warnings"
      aria-labelledby="listing-warnings-heading"
      className="overflow-hidden rounded-xl border border-border/70 bg-card"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-5 py-4">
        <ScanSearch className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="listing-warnings-heading" className="font-semibold text-foreground">
          Automated listing warnings
        </h2>
        {items.length > 0 ? <Badge variant="warning">{items.length} to decide</Badge> : null}
        <p className="w-full text-sm text-muted-foreground">
          Renters see these on the listing. Clear a false alarm, or uphold the warning. A property
          cannot be verified while one of its listings has a warning here.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5" role="status" aria-label="Loading listing warnings">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          Listing warnings could not be loaded right now.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {items.map((item) => (
            <li
              key={item.reviewId}
              id={`listing-warning-${item.reviewId}`}
              className={cn(
                'grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start',
                linkedId === item.reviewId && 'bg-primary/5 ring-1 ring-inset ring-primary/40'
              )}
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium text-foreground">{item.listingTitle}</h3>
                  {item.arrivedAfterVerification ? (
                    <Badge variant="danger">
                      {item.propertyVerifiedAt
                        ? `Property verified ${formatDate(item.propertyVerifiedAt)}`
                        : 'Property already verified'}
                    </Badge>
                  ) : null}
                  {item.openFraudAlertId ? <Badge variant="info">Fraud alert open</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Score {item.score} of 100 · checked {formatDate(item.scannedAt)}
                  {item.propertyTitle && item.propertyTitle !== item.listingTitle
                    ? ` · ${item.propertyTitle}`
                    : ''}
                </p>
                {item.reasons.length ? (
                  <ul className="list-disc space-y-0.5 pl-4 text-sm text-foreground">
                    {item.reasons.map((reason) => (
                      <li key={reason.code}>{reason.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The check gave no specific reasons.
                  </p>
                )}
                {item.arrivedAfterVerification ? (
                  <p className="text-xs text-muted-foreground">
                    This arrived after the property was verified. Until it is decided, renters are
                    told a new automated warning is being reviewed.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {item.openFraudAlertId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenAlert(item.openFraudAlertId!)}
                  >
                    Decide on the fraud alert
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNote('');
                        setPending({ item, decision: 'uphold' });
                      }}
                    >
                      Uphold
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setNote('');
                        setPending({ item, decision: 'clear' });
                      }}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={DECISION_COPY[pending.decision].title}
          description={DECISION_COPY[pending.decision].description}
          confirmLabel={DECISION_COPY[pending.decision].label}
          tone={DECISION_COPY[pending.decision].tone}
          promptLabel="Note for the record (optional)"
          promptPlaceholder="e.g. Photos match the site visit"
          promptValue={note}
          onPromptChange={setNote}
          isLoading={decideMutation.isPending}
          onConfirm={() => decideMutation.mutateAsync(pending)}
        />
      ) : null}
    </section>
  );
}
