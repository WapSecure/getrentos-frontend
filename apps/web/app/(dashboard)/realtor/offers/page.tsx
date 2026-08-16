'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Handshake } from 'lucide-react';
import { RealtorOfferCard } from '@/components/realtor/offers/RealtorOfferCard';
import { RealtorOfferNegotiationModal } from '@/components/realtor/offers/RealtorOfferNegotiationModal';
import type { RealtorOfferStatus, OfferThreadMessage } from '@/types/realtor';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorOffer, realtorService } from '@/services/realtorService';

type StatusFilter = 'all' | RealtorOfferStatus;

export default function RealtorOffersPage() {
  const [messagesByOffer, setMessagesByOffer] = useState<Record<string, OfferThreadMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useQuery({
    queryKey: realtorKeys.offers,
    queryFn: async () => (await unwrap(realtorService.listOffers())).map(mapRealtorOffer),
  });
  const counterOffer = useMutation({
    mutationFn: ({ id, amount, message }: { id: string; amount: number; message?: string }) =>
      unwrap(realtorService.counterOffer(id, { amount, message })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.offers }),
  });

  const appendMessage = (offerId: string, message: OfferThreadMessage) => {
    setMessagesByOffer((prev) => ({
      ...prev,
      [offerId]: [...(prev[offerId] || []), message],
    }));
  };

  const handleCounter = (offerId: string, amount: number, note: string) => {
    counterOffer.mutate({ id: offerId, amount, message: note || undefined });
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'realtor',
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
        senderId: 'realtor',
        senderName: 'You',
        type: 'message',
        text: note,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const activeOffer = offers.find((o) => o.id === activeOfferId) || null;

  const filteredOffers = offers.filter((o) => {
    const matchesSearch = o.listingTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'countered', label: 'Countered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Offers</h1>
        <p className="text-muted-foreground mt-1">
          {offers.length} offer{offers.length === 1 ? '' : 's'} on behalf of your clients
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by listing..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
          Loading offers…
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Handshake className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {offers.length === 0 ? 'No offers yet' : 'No offers match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {offers.length === 0
              ? 'Offers submitted by leads on your listings will appear here for you to negotiate.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer, index) => (
            <RealtorOfferCard
              key={offer.id}
              offer={offer}
              delay={index * 0.05}
              onClick={() => setActiveOfferId(offer.id)}
            />
          ))}
        </div>
      )}

      <RealtorOfferNegotiationModal
        offer={activeOffer}
        messages={activeOfferId ? messagesByOffer[activeOfferId] || [] : []}
        onClose={() => setActiveOfferId(null)}
        onCounter={handleCounter}
      />
    </>
  );
}
