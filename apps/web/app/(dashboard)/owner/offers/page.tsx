'use client';

import { LegacyInput, Pagination } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Handshake } from 'lucide-react';
import { OfferCard } from '@/components/owner/offers/OfferCard';
import { OfferNegotiationModal } from '@/components/owner/offers/OfferNegotiationModal';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { OfferStatus, OfferMessage } from '@/types/owner';

type StatusFilter = 'all' | OfferStatus;

const PAGE_SIZE = 10;

export default function OwnerOffersPage() {
  const queryClient = useQueryClient();
  const [pendingMessages, setPendingMessages] = useState<Record<string, OfferMessage[]>>({});
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

  const { data, isLoading } = useQuery({
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

  const appendMessage = (offerId: string, message: OfferMessage) => {
    setPendingMessages((prev) => ({
      ...prev,
      [offerId]: [...(prev[offerId] || []), message],
    }));
  };

  const handleAccept = (offerId: string) => {
    acceptMutation.mutate(offerId);
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'owner',
      senderName: 'You',
      type: 'accepted',
      text: 'Offer accepted',
      timestamp: new Date().toISOString(),
    });
  };

  const handleReject = (offerId: string) => {
    rejectMutation.mutate(offerId);
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'owner',
      senderName: 'You',
      type: 'rejected',
      text: 'Offer rejected',
      timestamp: new Date().toISOString(),
    });
  };

  const handleCounter = (offerId: string, amount: number, note: string) => {
    counterMutation.mutate({ offerId, amount, note });
    appendMessage(offerId, {
      id: `sys_${Date.now()}`,
      offerId,
      senderId: 'owner',
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
        senderId: 'owner',
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
      senderId: 'owner',
      senderName: 'You',
      type: 'message',
      text,
      timestamp: new Date().toISOString(),
    });
  };

  const activeOffer = offers.find((o) => o.id === activeOfferId) || null;

  const messages: OfferMessage[] = activeOfferId
    ? [
        ...thread.map((m) => ({
          id: m.id,
          offerId: m.offerId,
          senderId: (m.senderId === 'owner' ? 'owner' : 'buyer') as 'owner' | 'buyer',
          senderName: m.senderName,
          type: m.type as OfferMessage['type'],
          amount: m.amount,
          text: m.text ?? '',
          timestamp: m.timestamp,
        })),
        ...(pendingMessages[activeOfferId] || []),
      ]
    : [];

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
          {isLoading
            ? 'Loading…'
            : `${total} offer${total === 1 ? '' : 's'} across your sale listings`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer or property..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
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

      {!isLoading && offers.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Handshake className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0 ? 'No offers yet' : 'No offers match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? 'Offers submitted by buyers on your published sale listings will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
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
        onSendMessage={handleSendMessage}
      />
    </>
  );
}
