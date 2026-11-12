'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  useToast,
} from '@sureground/ui';
import { cn } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import {
  collectionPath,
  type ListingCollectionFeature,
  type ListingCollectionOptOut,
} from '@/lib/collections';
import { listingCollectionsService } from '@/services/collectionsService';

const KEY = ['me', 'listing-collections'] as const;

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Try again.';

type Pending =
  | { kind: 'all'; listingId: string; listingTitle: string }
  | { kind: 'allow'; optOut: ListingCollectionOptOut };

/**
 * Consent for Sureground collections (decided 2026-11-12): the lister is told when staff add their
 * listing, can remove it in one tap, and can keep it out of every Sureground collection.
 */
export function ListingCollectionsDesk() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const focusCollection = params.get('collection');
  const focusListing = params.get('listing');
  const [pending, setPending] = useState<Pending | null>(null);

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => unwrap(listingCollectionsService.list()),
  });
  const optOut = useMutation({
    mutationFn: (input: {
      listingId: string;
      collectionId?: string;
      scope: 'collection' | 'all';
    }) => unwrap(listingCollectionsService.optOut(input)),
    onSuccess: (next, input) => {
      queryClient.setQueryData(KEY, next);
      setPending(null);
      toast.success(
        input.scope === 'all'
          ? 'Your listing is out of all Sureground collections'
          : 'Your listing was removed from the collection'
      );
    },
  });
  const allowAgain = useMutation({
    mutationFn: (id: string) => unwrap(listingCollectionsService.allowAgain(id)),
    onSuccess: (next) => {
      queryClient.setQueryData(KEY, next);
      setPending(null);
      toast.success('Sureground can consider this listing again');
    },
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError || !query.data) {
    return <PageErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  const { features, optOuts } = query.data;
  const outOfAll = new Set(optOuts.filter((o) => o.collectionId === null).map((o) => o.listingId));
  const focusedGone =
    focusCollection &&
    focusListing &&
    !features.some((f) => f.collectionId === focusCollection && f.listingId === focusListing) &&
    optOuts.some(
      (o) =>
        o.listingId === focusListing &&
        (o.collectionId === focusCollection || o.collectionId === null)
    );

  return (
    <div className="space-y-6">
      {focusedGone && (
        <Alert variant="success" title="Already removed">
          That listing is no longer in the collection.
        </Alert>
      )}
      {(optOut.isError || allowAgain.isError) && (
        <Alert variant="danger">{errorMessage(optOut.error ?? allowAgain.error)}</Alert>
      )}

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">In collections now</h2>
        {!features.length ? (
          <EmptyState
            icon={LayoutGrid}
            size="compact"
            title="None of your listings are in a Sureground collection"
            description="If the Sureground team adds one, you will get a notice with a way to remove it."
          />
        ) : (
          <ul className="divide-y divide-border">
            {features.map((f) => (
              <FeatureRow
                key={`${f.collectionId}:${f.listingId}`}
                feature={f}
                focused={f.collectionId === focusCollection && f.listingId === focusListing}
                removing={
                  optOut.isPending &&
                  optOut.variables?.listingId === f.listingId &&
                  optOut.variables?.collectionId === f.collectionId
                }
                onRemove={() =>
                  optOut.mutate({
                    listingId: f.listingId,
                    collectionId: f.collectionId,
                    scope: 'collection',
                  })
                }
                onKeepOutOfAll={
                  outOfAll.has(f.listingId)
                    ? undefined
                    : () =>
                        setPending({
                          kind: 'all',
                          listingId: f.listingId,
                          listingTitle: f.listingTitle,
                        })
                }
              />
            ))}
          </ul>
        )}
      </Card>

      {optOuts.length > 0 && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Kept out</h2>
            <p className="text-sm text-muted-foreground">
              The Sureground team can’t add these listings back while they are here.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {optOuts.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{o.listingTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.collectionId === null
                      ? 'Out of all Sureground collections'
                      : `Out of “${o.collectionTitle ?? 'a collection'}”`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPending({ kind: 'allow', optOut: o })}
                >
                  Allow again
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={pending?.kind === 'all'}
        onOpenChange={(open) => !open && setPending(null)}
        title="Keep this listing out of all Sureground collections?"
        description={
          pending?.kind === 'all'
            ? `“${pending.listingTitle}” comes out of every Sureground collection it is in, and the team can’t add it to any other while this is on. Collections your estate, agency or realtor make are not affected.`
            : ''
        }
        confirmLabel="Keep it out"
        onConfirm={() =>
          pending?.kind === 'all' && optOut.mutate({ listingId: pending.listingId, scope: 'all' })
        }
        isLoading={optOut.isPending && optOut.variables?.scope === 'all'}
      />
      <ConfirmDialog
        open={pending?.kind === 'allow'}
        onOpenChange={(open) => !open && setPending(null)}
        title="Allow this listing again?"
        description="The Sureground team will be able to add it to collections again. It is not put back anywhere now, and you will be told if it is added."
        confirmLabel="Allow again"
        tone="primary"
        onConfirm={() => pending?.kind === 'allow' && allowAgain.mutate(pending.optOut.id)}
        isLoading={allowAgain.isPending}
      />
    </div>
  );
}

function FeatureRow({
  feature: f,
  focused,
  removing,
  onRemove,
  onKeepOutOfAll,
}: {
  feature: ListingCollectionFeature;
  focused: boolean;
  removing: boolean;
  onRemove: () => void;
  onKeepOutOfAll?: () => void;
}) {
  return (
    <li
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 py-3',
        focused && '-mx-3 rounded-xl bg-primary/5 px-3'
      )}
      aria-current={focused ? 'true' : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{f.listingTitle}</p>
        <p className="text-sm text-muted-foreground">
          In{' '}
          {f.published ? (
            <Link
              href={collectionPath(f.collectionSlug)}
              className="font-medium text-primary hover:underline"
            >
              {f.collectionTitle}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{f.collectionTitle}</span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant={f.published ? 'success' : 'neutral'}>
            {f.published ? 'On the site' : 'Not on the site yet'}
          </Badge>
          {f.kind === 'rule' && <Badge variant="neutral">Matches a saved search</Badge>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onRemove} isLoading={removing}>
          Remove my listing
        </Button>
        {onKeepOutOfAll && (
          <Button variant="ghost" size="sm" onClick={onKeepOutOfAll}>
            Keep out of all
          </Button>
        )}
      </div>
    </li>
  );
}
