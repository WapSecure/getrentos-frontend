'use client';

import {
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  Skeleton,
  ToggleChip,
} from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import { OfferCard } from '@/components/owner/offers/OfferCard';
import { OfferNegotiationModal } from '@/components/owner/offers/OfferNegotiationModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import type { LandlordOffer, LandlordOfferStatus } from '@/types/landlord';
import type { OfferMessage } from '@/types/owner';

type StatusFilter = 'all' | LandlordOfferStatus;

const PAGE_SIZE = 10;

export default function LandlordOffersPage() {
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
      ...landlordKeys.offers(filter === 'all' ? undefined : filter),
      {
        search: debouncedSearch,
        status: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listOffers({
          search: debouncedSearch || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const offers: LandlordOffer[] = data?.items ?? [];
  const total = data?.total ?? 0;

  // Negotiation thread for the currently-open offer, fetched from the backend.
  const { data: thread = [] } = useQuery({
    queryKey: landlordKeys.offerThread(activeOfferId ?? ''),
    queryFn: () => unwrap(landlordService.getOfferThread(activeOfferId as string)),
    enabled: !!activeOfferId,
  });

  const invalidate = (offerId?: string) => {
    queryClient.invalidateQueries({ queryKey: landlordKeys.offers() });
    if (offerId) queryClient.invalidateQueries({ queryKey: landlordKeys.offerThread(offerId) });
  };

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => unwrap(landlordService.acceptOffer(offerId)),
    onSuccess: (_result, offerId) => invalidate(offerId),
  });
  const rejectMutation = useMutation({
    mutationFn: (offerId: string) => unwrap(landlordService.rejectOffer(offerId)),
    onSuccess: (_result, offerId) => invalidate(offerId),
  });
  const counterMutation = useMutation({
    mutationFn: ({ offerId, amount, note }: { offerId: string; amount: number; note?: string }) =>
      unwrap(landlordService.counterOffer(offerId, amount, note)),
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

      {/* Accepting an offer opens an escrow/payout obligation: financially verified (tier 3) landlords only. */}
      {(acceptMutation.error || rejectMutation.error || counterMutation.error) && (
        <div className="mb-6">
          <VerificationRequiredNotice
            error={acceptMutation.error || rejectMutation.error || counterMutation.error}
            href={ROUTES.LANDLORD_OFFERS}
            verificationHref={ROUTES.LANDLORD_VERIFICATION}
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
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter offers by status">
          {filterOptions.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
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
          className="mt-8"
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
