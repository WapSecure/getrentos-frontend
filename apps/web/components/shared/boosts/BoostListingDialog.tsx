'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Rocket } from '@sureground/icons';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from '@sureground/ui';
import { formatCurrency } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { billingHrefFor } from '@/lib/planGate';
import { boostService, type BoostPack } from '@/services/boostService';

export const BOOST_RETURN_KEY = 'sureground.boostReturnTo';

export interface BoostTarget {
  id: string;
  title: string;
}

const naira = (kobo: number) => formatCurrency(kobo / 100);

export function BoostListingDialog({
  target,
  onClose,
}: {
  target: BoostTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md" padded={false}>
        {target ? <BoostBody key={target.id} target={target} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function BoostBody({ target, onClose }: { target: BoostTarget; onClose: () => void }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [boostedUntil, setBoostedUntil] = useState<string | null>(null);
  const summary = useQuery({
    queryKey: ['boosts'],
    queryFn: () => unwrap(boostService.summary()),
  });
  const boost = useMutation({
    mutationFn: () => unwrap(boostService.boostListing(target.id)),
    onSuccess: (result) => {
      setBoostedUntil(result.boostedUntil);
      queryClient.setQueryData(['boosts'], result.summary);
    },
  });
  const checkout = useMutation({
    mutationFn: (pack: BoostPack) => unwrap(boostService.checkout(pack)),
    onSuccess: ({ authorizationUrl }) => {
      try {
        sessionStorage.setItem(BOOST_RETURN_KEY, pathname ?? '/');
      } catch {
        // Only decides where the return page links back to.
      }
      window.location.assign(authorizationUrl);
    },
  });

  const s = summary.data;
  const left = s ? s.includedLeft + s.purchasedLeft : 0;

  return (
    <>
      <div className="border-b border-border p-5 pr-12">
        <DialogTitle className="text-base font-semibold text-foreground">
          Boost this listing
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {target.title}
        </DialogDescription>
      </div>
      <div className="space-y-4 p-5">
        {summary.isPending ? (
          <Skeleton className="h-20" />
        ) : summary.isError || !s ? (
          <Alert variant="danger">We couldn&apos;t load your boosts. Please try again.</Alert>
        ) : boostedUntil ? (
          <div role="status" className="space-y-3">
            <p className="text-sm text-foreground">
              Boosted until {formatDate(boostedUntil)}. It now appears first in search results,
              marked as boosted.
            </p>
            <Button variant="primary" fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              A boost puts this listing first in search results for {s.days} days, marked as
              boosted. Boosting again adds {s.days} more days.
            </p>
            <p className="text-sm text-foreground">
              {left === 0
                ? 'You have no boosts left.'
                : `You have ${left} boost${left === 1 ? '' : 's'}${
                    s.includedPerMonth > 0
                      ? ` (${s.includedLeft} of ${s.includedPerMonth} included this month)`
                      : ''
                  }.`}
            </p>
            {boost.isError && <Alert variant="danger">{boost.error.message}</Alert>}
            {checkout.isError && <Alert variant="danger">{checkout.error.message}</Alert>}
            {left > 0 ? (
              <Button
                variant="primary"
                fullWidth
                isLoading={boost.isPending}
                onClick={() => boost.mutate()}
                icon={<Rocket className="h-4 w-4" />}
              >
                Boost for {s.days} days
              </Button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  isLoading={checkout.isPending && checkout.variables === 'single'}
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate('single')}
                >
                  1 boost, {naira(s.prices.singleKobo)}
                </Button>
                <Button
                  variant="primary"
                  isLoading={checkout.isPending && checkout.variables === 'ten'}
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate('ten')}
                >
                  10 boosts, {naira(s.prices.tenPackKobo)}
                </Button>
              </div>
            )}
            {s.includedPerMonth === 0 && (
              <p className="text-xs text-muted-foreground">
                Pro includes 5 boosts every month.{' '}
                <Link
                  href={billingHrefFor(pathname)}
                  className="font-medium text-primary hover:underline"
                >
                  See Pro
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
