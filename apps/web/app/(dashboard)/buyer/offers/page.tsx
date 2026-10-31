'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Handshake } from 'lucide-react';
import { BuyerOfferCard } from '@/components/buyer/offers/BuyerOfferCard';
import { MAKE_OFFER_DRAFT_KEY, MakeOfferModal } from '@/components/buyer/offers/MakeOfferModal';
import { BuyerOfferNegotiationModal } from '@/components/buyer/offers/BuyerOfferNegotiationModal';
import {
  Button,
  Pagination,
  QueryState,
  SearchInput,
  SegmentedControl,
  Skeleton,
  hasSessionDraft,
  useToast,
} from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';
import type { BuyerOffer, BuyerOfferStatus, BuyerOfferMessage } from '@/types/buyer';

type StatusFilter = 'all' | BuyerOfferStatus;

function BuyerOffersPageContent() {
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get('property') || undefined;
  const queryClient = useQueryClient();
  const toast = useToast();
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const offersQuery = useQuery({
    queryKey: [
      ...buyerKeys.offers,
      { search: searchQuery, status: filter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        buyerService.listOffers({
          search: searchQuery || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const offersData = offersQuery.data;
  const offers = offersData?.items ?? [];
  const total = offersData?.total ?? 0;

  const invalidate = (offerId?: string) => {
    queryClient.invalidateQueries({ queryKey: buyerKeys.offers });
    if (offerId) queryClient.invalidateQueries({ queryKey: buyerKeys.offerThread(offerId) });
  };

  const createMutation = useMutation({
    mutationFn: (data: {
      listingId: string;
      amount: number;
      depositAmount?: number;
      financingType?: string;
      message?: string;
      acknowledgedNotVerified?: string[];
    }) => unwrap(buyerService.createOffer(data)),
    onSuccess: () => {
      invalidate();
      setIsMakeOfferOpen(false);
      toast.success('Offer sent. We will let you know when the seller responds.');
    },
  });
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => unwrap(buyerService.withdrawOffer(id)),
    onSuccess: (_result, id) => invalidate(id),
  });
  const counterMutation = useMutation({
    mutationFn: ({ offerId, amount, note }: { offerId: string; amount: number; note?: string }) =>
      unwrap(buyerService.counterOffer(offerId, amount, note)),
    onSuccess: (_result, { offerId }) => invalidate(offerId),
  });
  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => unwrap(buyerService.acceptOffer(offerId)),
    onSuccess: (_result, offerId) => invalidate(offerId),
  });

  // Reopen the offer form when the buyer comes back from signing in with a draft.
  const [isMakeOfferOpen, setIsMakeOfferOpen] = useState(
    () => !!defaultPropertyId || hasSessionDraft(MAKE_OFFER_DRAFT_KEY)
  );
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);

  // Negotiation thread for the currently-open offer.
  const { data: thread = [] } = useQuery({
    queryKey: buyerKeys.offerThread(activeOfferId ?? ''),
    queryFn: () => unwrap(buyerService.getOfferThread(activeOfferId as string)),
    enabled: !!activeOfferId,
  });

  const handleMakeOffer = async (offerData: Omit<BuyerOffer, 'id' | 'status' | 'submittedAt'>) => {
    try {
      await createMutation.mutateAsync({
        listingId: offerData.propertyId,
        amount: offerData.offerAmount,
        depositAmount: offerData.depositAmount,
        financingType: offerData.financingType,
        message: offerData.message,
        acknowledgedNotVerified: offerData.acknowledgedNotVerified,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleAcceptCounter = async (offerId: string) => {
    try {
      await acceptMutation.mutateAsync(offerId);
      return true;
    } catch {
      return false;
    }
  };

  const handleWithdraw = async (offerId: string) => {
    try {
      await withdrawMutation.mutateAsync(offerId);
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

  const messages: BuyerOfferMessage[] = activeOfferId
    ? thread.map((m) => ({
        id: m.id,
        offerId: m.offerId,
        senderId: (m.senderId === 'buyer' ? 'buyer' : 'owner') as 'buyer' | 'owner',
        senderName: m.senderName,
        type: m.type as BuyerOfferMessage['type'],
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offers</h1>
          <p className="text-muted-foreground mt-1">
            {total} offer{total === 1 ? '' : 's'} you&apos;ve made
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="w-fit"
          onClick={() => setIsMakeOfferOpen(true)}
        >
          Make an Offer
        </Button>
      </div>

      {createMutation.error && (
        <div className="mb-6">
          <VerificationRequiredNotice
            error={createMutation.error}
            href={`${ROUTES.BUYER_SETTINGS}?tab=verification`}
            verificationHref={ROUTES.BUYER_VERIFICATION}
            scoreHref={ROUTES.BUYER_TRUST_PROFILE}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by property..."
          label="Search offers"
          className="flex-1 max-w-sm"
        />
        <SegmentedControl
          size="sm"
          aria-label="Filter by status"
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          segments={filterOptions}
          className="max-w-full overflow-x-auto"
        />
      </div>

      <QueryState
        isLoading={offersQuery.isLoading}
        isError={offersQuery.isError && !offersData}
        onRetry={() => void offersQuery.refetch()}
        isRetrying={offersQuery.isFetching}
        isEmpty={offers.length === 0}
        empty={{
          icon: Handshake,
          title: total === 0 ? 'No offers match your filters' : 'No offers on this page',
          description:
            total === 0
              ? 'Try adjusting your search or filter.'
              : 'Choose another page to view more offers.',
        }}
        scope="page"
        loading={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer, index) => (
            <BuyerOfferCard
              key={offer.id}
              offer={offer}
              delay={index * 0.05}
              onClick={() => setActiveOfferId(offer.id)}
            />
          ))}
        </div>
      </QueryState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      <MakeOfferModal
        isOpen={isMakeOfferOpen}
        onClose={() => setIsMakeOfferOpen(false)}
        defaultPropertyId={defaultPropertyId}
        onSubmit={handleMakeOffer}
      />

      <BuyerOfferNegotiationModal
        offer={activeOffer}
        messages={messages}
        onClose={() => setActiveOfferId(null)}
        onAcceptCounter={handleAcceptCounter}
        onWithdraw={handleWithdraw}
        onCounter={handleCounter}
      />
    </>
  );
}

export default function BuyerOffersPage() {
  return (
    <Suspense fallback={null}>
      <BuyerOffersPageContent />
    </Suspense>
  );
}
