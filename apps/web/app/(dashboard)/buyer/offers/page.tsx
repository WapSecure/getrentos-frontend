'use client';

import { LegacyInput } from '@getrentos/ui';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Handshake } from 'lucide-react';
import { BuyerOfferCard } from '@/components/buyer/offers/BuyerOfferCard';
import { MakeOfferModal } from '@/components/buyer/offers/MakeOfferModal';
import { BuyerOfferNegotiationModal } from '@/components/buyer/offers/BuyerOfferNegotiationModal';
import { Button } from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/cn';
import type { BuyerOffer, BuyerOfferStatus, BuyerOfferMessage } from '@/types/buyer';

type StatusFilter = 'all' | BuyerOfferStatus;

function BuyerOffersPageContent() {
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get('property') || undefined;
  const queryClient = useQueryClient();

  const { data: offers = [] } = useQuery({
    queryKey: buyerKeys.offers,
    queryFn: () => unwrap(buyerService.listOffers()),
  });

  const { data: listings = [] } = useQuery({
    queryKey: buyerKeys.listings,
    queryFn: () => unwrap(buyerService.discover({})),
  });

  const invalidate = (offerId?: string) => {
    queryClient.invalidateQueries({ queryKey: buyerKeys.offers });
    if (offerId) queryClient.invalidateQueries({ queryKey: buyerKeys.offerThread(offerId) });
  };

  const createMutation = useMutation({
    mutationFn: (data: {
      listingId: string;
      amount: number;
      financingType?: string;
      message?: string;
    }) => unwrap(buyerService.createOffer(data)),
    onSuccess: () => invalidate(),
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

  const [pendingMessages, setPendingMessages] = useState<Record<string, BuyerOfferMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isMakeOfferOpen, setIsMakeOfferOpen] = useState(!!defaultPropertyId);
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);

  // Negotiation thread for the currently-open offer.
  const { data: thread = [] } = useQuery({
    queryKey: buyerKeys.offerThread(activeOfferId ?? ''),
    queryFn: () => unwrap(buyerService.getOfferThread(activeOfferId as string)),
    enabled: !!activeOfferId,
  });

  const appendMessage = (offerId: string, message: BuyerOfferMessage) => {
    setPendingMessages((prev) => ({
      ...prev,
      [offerId]: [...(prev[offerId] || []), message],
    }));
  };

  const handleMakeOffer = (offerData: Omit<BuyerOffer, 'id' | 'status' | 'submittedAt'>) => {
    createMutation.mutate({
      listingId: offerData.propertyId,
      amount: offerData.offerAmount,
      financingType: offerData.financingType,
      message: offerData.message,
    });
    setIsMakeOfferOpen(false);
  };

  const handleAcceptCounter = (offerId: string) => {
    acceptMutation.mutate(offerId);
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'buyer',
      senderName: 'You',
      type: 'accepted',
      text: 'Counter offer accepted',
      timestamp: new Date().toISOString(),
    });
  };

  const handleWithdraw = (offerId: string) => {
    withdrawMutation.mutate(offerId);
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'buyer',
      senderName: 'You',
      type: 'rejected',
      text: 'Offer withdrawn',
      timestamp: new Date().toISOString(),
    });
  };

  const handleCounter = (offerId: string, amount: number, note: string) => {
    counterMutation.mutate({ offerId, amount, note });
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'buyer',
      senderName: 'You',
      type: 'counter',
      amount,
      text: 'Countered with',
      timestamp: new Date().toISOString(),
    });
    if (note.trim()) {
      appendMessage(offerId, {
        id: `sys_${Date.now() + 1}`,
        offerId,
        senderId: 'buyer',
        senderName: 'You',
        type: 'message',
        text: note,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleSendMessage = (offerId: string, text: string) => {
    appendMessage(offerId, {
      id: `msg_${Date.now()}`,
      offerId,
      senderId: 'buyer',
      senderName: 'You',
      type: 'message',
      text,
      timestamp: new Date().toISOString(),
    });
  };

  const activeOffer = offers.find((o) => o.id === activeOfferId) || null;

  const messages: BuyerOfferMessage[] = activeOfferId
    ? [
        ...thread.map((m) => ({
          id: m.id,
          offerId: m.offerId,
          senderId: (m.senderId === 'buyer' ? 'buyer' : 'owner') as 'buyer' | 'owner',
          senderName: m.senderName,
          type: m.type as BuyerOfferMessage['type'],
          amount: m.amount,
          text: m.text ?? '',
          timestamp: m.timestamp,
        })),
        ...(pendingMessages[activeOfferId] || []),
      ]
    : [];

  const filteredOffers = offers.filter((o) => {
    const matchesSearch = o.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'countered', label: 'Countered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offers</h1>
          <p className="text-muted-foreground mt-1">
            {offers.length} offer{offers.length === 1 ? '' : 's'} you&apos;ve made
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsMakeOfferOpen(true)}>
          <Plus className="w-4 h-4" />
          Make an Offer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by property..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Handshake className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {offers.length === 0 ? 'No offers yet' : 'No offers match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {offers.length === 0
              ? 'Found a property you like? Make an offer to start negotiating with the owner.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer, index) => (
            <BuyerOfferCard
              key={offer.id}
              offer={offer}
              delay={index * 0.05}
              onClick={() => setActiveOfferId(offer.id)}
            />
          ))}
        </div>
      )}

      <MakeOfferModal
        isOpen={isMakeOfferOpen}
        onClose={() => setIsMakeOfferOpen(false)}
        listings={listings}
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
        onSendMessage={handleSendMessage}
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
