'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import { RealtorOfferCard } from '@/components/realtor/offers/RealtorOfferCard';
import { RealtorOfferNegotiationModal } from '@/components/realtor/offers/RealtorOfferNegotiationModal';
import type { RealtorOfferStatus } from '@/types/realtor';
import {
  EmptyState,
  ListSkeleton,
  Pagination,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorOffer, realtorService } from '@/services/realtorService';

type StatusFilter = 'all' | RealtorOfferStatus;

const PAGE_SIZE = 10;

const OFFER_STATUS_TO_API_STATUS: Record<
  RealtorOfferStatus,
  'SUBMITTED' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED'
> = {
  submitted: 'SUBMITTED',
  countered: 'COUNTERED',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
  closed: 'CLOSED',
};

export default function RealtorOffersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const offerStatus = filter === 'all' ? undefined : OFFER_STATUS_TO_API_STATUS[filter];
  const { data, isLoading } = useQuery({
    queryKey: [
      ...realtorKeys.offers,
      { page, pageSize: PAGE_SIZE, search: searchQuery.trim() || undefined, status: offerStatus },
    ],
    queryFn: async () => {
      const result = await unwrap(
        realtorService.listOffers({
          page,
          pageSize: PAGE_SIZE,
          search: searchQuery.trim() || undefined,
          status: offerStatus,
        })
      );
      return { ...result, items: result.items.map(mapRealtorOffer) };
    },
    placeholderData: keepPreviousData,
  });
  const offers = data?.items ?? [];
  const total = data?.total ?? 0;
  const counterOffer = useMutation({
    mutationFn: ({ id, amount, message }: { id: string; amount: number; message?: string }) =>
      unwrap(realtorService.counterOffer(id, { amount, message })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.offers }),
    onError: (error) =>
      toast.error(error.message || 'Unable to submit the counter offer. Please try again.'),
  });

  const handleCounter = async (offerId: string, amount: number, note: string) => {
    try {
      await counterOffer.mutateAsync({ id: offerId, amount, message: note || undefined });
      return true;
    } catch {
      return false;
    }
  };

  const activeOffer = offers.find((o) => o.id === activeOfferId) || null;

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'countered', label: 'Countered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Offers</h1>
        <p className="text-muted-foreground mt-1">
          {total} offer{total === 1 ? '' : 's'} on behalf of your clients
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by listing..."
          label="Search offers"
          className="flex-1 max-w-sm"
        />
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as StatusFilter);
            setPage(1);
          }}
        >
          <TabsList className="max-w-full">
            {filterOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading offers" />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={total === 0 ? 'No offers yet' : 'No offers match your filters'}
          description={
            total === 0
              ? 'Offers submitted by leads on your listings will appear here for you to negotiate.'
              : 'Try adjusting your search or filter.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer, index) => (
            <RealtorOfferCard
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

      <RealtorOfferNegotiationModal
        offer={activeOffer}
        messages={activeOffer?.thread ?? []}
        onClose={() => setActiveOfferId(null)}
        onCounter={handleCounter}
      />
    </>
  );
}
