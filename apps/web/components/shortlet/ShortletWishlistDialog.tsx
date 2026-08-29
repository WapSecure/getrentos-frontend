'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Skeleton,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { BedDouble, Heart, MapPin } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import type { ShortletListing } from '@/types/shortlet';

export function ShortletWishlistDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: shortletKeys.wishlist,
    queryFn: () => unwrap(shortletService.myWishlist({ page: 1, pageSize: 50 })),
  });
  const listings = data?.items ?? [];

  const unsave = useMutation({
    mutationFn: (listingId: string) => unwrap(shortletService.unsaveWishlist(listingId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.wishlist });
      queryClient.invalidateQueries({ queryKey: shortletKeys.wishlistIds });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <div className="p-5">
          <DialogTitle>Saved shortlets</DialogTitle>
          <DialogDescription>Shortlets you saved to visit later.</DialogDescription>
        </div>
        <div className="max-h-[70vh] overflow-y-auto border-t border-border p-5">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Tap the heart on any shortlet to save it here."
            />
          ) : (
            <div className="divide-y divide-border">
              {listings.map((l) => (
                <WishlistRow
                  key={l.id}
                  listing={l}
                  removing={unsave.isPending}
                  onRemove={() => unsave.mutate(l.id)}
                  onOpen={() => {
                    onClose();
                    router.push(`/shortlets/${l.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WishlistRow({
  listing,
  removing,
  onRemove,
  onOpen,
}: {
  listing: ShortletListing;
  removing: boolean;
  onRemove: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary/60">
        {listing.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <BedDouble className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{listing.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.state}
        </p>
        <p className="mt-0.5 text-sm">
          {listing.nightlyRate != null ? formatCurrency(listing.nightlyRate) : '—'}
          {listing.pricingMode === 'PER_NIGHT' ? ' / night' : ' / stay'}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpen}>
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={removing}
          aria-label="Remove"
        >
          <Heart className="h-4 w-4 fill-destructive text-destructive" />
        </Button>
      </div>
    </div>
  );
}
