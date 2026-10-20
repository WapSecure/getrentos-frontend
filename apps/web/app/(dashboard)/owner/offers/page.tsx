'use client';

import {
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  Skeleton,
} from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import { OfferCard } from '@/components/owner/offers/OfferCard';
import { OfferNegotiationModal } from '@/components/owner/offers/OfferNegotiationModal';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import type { OfferStatus, OfferMessage } from '@/types/owner';

type StatusFilter = 'all' | OfferStatus;

const PAGE_SIZE = 10;

export default function OwnerOffersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      ...ownerKeys.offers,
      {
        search: debouncedSearch,
        status: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listOffers({
          search: debouncedSearch || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const offers = data?.items ?? [];
  const total = data?.total ?? 0;

  // Negotiation thread for the currently-open offer, fetched from the backend.
  const { data: thread = [] } = useQuery({
    queryKey: ownerKeys.offerThread(activeOfferId ?? ''),
    queryFn: () => unwrap(ownerService.getOfferThread(activeOfferId as string)),
    enabled: !!activeOfferId,
  });

  const invalidate = (offerId?: string) => {
    queryClient.invalidateQueries({ queryKey: ownerKeys.offers });
    if (offerId) queryClient.invalidateQueries({ queryKey: ownerKeys.offerThread(offerId) });
  };

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => unwrap(ownerService.acceptOffer(offerId)),
    onSuccess: (_result, offerId) => invalidate(offerId),
  });
  const rejectMutation = useMutation({
    mutationFn: (offerId: string) => unwrap(ownerService.rejectOffer(offerId)),
    onSuccess: (_result, offerId) => invalidate(offerId),
  });
  const counterMutation = useMutation({
    mutationFn: ({ offerId, amount, note }: { offerId: string; amount: number; note?: string }) =>
      unwrap(ownerService.counterOffer(offerId, amount, note)),
    onSuccess: (_result, { offerId }) => invalidate(offerId),
  });

  const handleAccept = async (offerId: string) => {
    try {
      await acceptMutation.mutateAsync(offerId);
      return true;
    } catch {
      return false;
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      await rejectMutation.mutateAsync(offerId);
      return true;
    } catch {
      return false;
    }
  };

  const handleCounter = async (offerId: string, amount: number, note: string) => {
    try {
      await counterMutation.mutateAsync({ offerId, amount, note });
      return true;
    } catch {
      return false;
    }
  };

  const activeOffer = offers.find((o) => o.id === activeOfferId) || null;

  const messages: OfferMessage[] = activeOfferId
    ? thread.map((m) => ({
        id: m.id,
        offerId: m.offerId,
        senderId: (m.senderId === 'owner' ? 'owner' : 'buyer') as 'owner' | 'buyer',
        senderName: m.senderName,
        type: m.type as OfferMessage['type'],
        amount: m.amount,
        text: m.text ?? '',
        timestamp: m.timestamp,
      }))
    : [];

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'countered', label: 'Countered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'expired', label: 'Expired' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Offers</h1>
        <div className="text-muted-foreground mt-1">
          {isLoading || (isError && !data) ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            `${total} offer${total === 1 ? '' : 's'} across your sale listings`
          )}
        </div>
      </div>

      {/* Accepting an offer opens an escrow/payout obligation: financially verified (tier 3) owners only. */}
      {(acceptMutation.error || rejectMutation.error || counterMutation.error) && (
        <div className="mb-6">
          <VerificationRequiredNotice
            error={acceptMutation.error || rejectMutation.error || counterMutation.error}
            href={ROUTES.OWNER_OFFERS}
            verificationHref={ROUTES.OWNER_VERIFICATION}
            scoreHref={ROUTES.OWNER_TRUST_PROFILE}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search by buyer or property..."
          label="Search offers"
          className="flex-1 max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-secondary rounded-lg max-w-full w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} variant="cards" label="Loading offers" />
      ) : isError && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your offers"
          onRetry={() => void refetch()}
        />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={total === 0 ? 'No offers yet' : 'No offers match your filters'}
          description={
            total === 0
              ? 'Offers submitted by buyers on your published sale listings will appear here.'
              : 'Try adjusting your search or filter.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer, index) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              delay={index * 0.05}
              onClick={() => setActiveOfferId(offer.id)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <OfferNegotiationModal
        offer={activeOffer}
        messages={messages}
        onClose={() => setActiveOfferId(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        onCounter={handleCounter}
      />
    </>
  );
}
