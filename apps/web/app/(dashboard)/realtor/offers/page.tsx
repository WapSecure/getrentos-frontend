'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { Search, Handshake } from 'lucide-react';
import { RealtorOfferCard } from '@/components/realtor/offers/RealtorOfferCard';
import { RealtorOfferNegotiationModal } from '@/components/realtor/offers/RealtorOfferNegotiationModal';
import type { RealtorOffer, RealtorOfferStatus, OfferThreadMessage } from '@/types/realtor';

const mockOffers: RealtorOffer[] = [
  {
    id: 'offer_001',
    listingId: 'listing_003',
    listingTitle: 'Spacious 4-Bed Duplex in Lekki',
    clientName: 'Adaeze Okafor',
    leadName: 'Blessing Eze',
    offerAmount: 85_000_000,
    askingPrice: 95_000_000,
    status: 'submitted',
    submittedAt: '2026-08-07T09:30:00.000Z',
  },
];

const initialMessages: Record<string, OfferThreadMessage[]> = {
  offer_001: [
    {
      id: 'm1',
      offerId: 'offer_001',
      senderId: 'lead',
      senderName: 'Blessing Eze',
      type: 'offer',
      amount: 85_000_000,
      text: 'Submitted an offer of',
      timestamp: '2026-08-07T09:30:00.000Z',
    },
  ],
};

type StatusFilter = 'all' | RealtorOfferStatus;

export default function RealtorOffersPage() {
  const [offers, setOffers] = useState<RealtorOffer[]>(mockOffers);
  const [messagesByOffer, setMessagesByOffer] =
    useState<Record<string, OfferThreadMessage[]>>(initialMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);

  const appendMessage = (offerId: string, message: OfferThreadMessage) => {
    setMessagesByOffer((prev) => ({
      ...prev,
      [offerId]: [...(prev[offerId] || []), message],
    }));
  };

  const handleAccept = (offerId: string) => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'accepted' } : o)));
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'realtor',
      senderName: 'You',
      type: 'accepted',
      text: 'Offer accepted on behalf of client',
      timestamp: new Date().toISOString(),
    });
  };

  const handleReject = (offerId: string) => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'rejected' } : o)));
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'realtor',
      senderName: 'You',
      type: 'rejected',
      text: 'Offer rejected on behalf of client',
      timestamp: new Date().toISOString(),
    });
  };

  const handleCounter = (offerId: string, amount: number, note: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'countered', offerAmount: amount } : o))
    );
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

  const handleSendMessage = (offerId: string, text: string) => {
    appendMessage(offerId, {
      id: `msg_${Date.now()}`,
      offerId,
      senderId: 'realtor',
      senderName: 'You',
      type: 'message',
      text,
      timestamp: new Date().toISOString(),
    });
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

      {filteredOffers.length === 0 ? (
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
        onAccept={handleAccept}
        onReject={handleReject}
        onCounter={handleCounter}
        onSendMessage={handleSendMessage}
      />
    </>
  );
}
