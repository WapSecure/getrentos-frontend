'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Handshake } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { RealtorOfferCard } from '@/components/realtor/offers/RealtorOfferCard';
import { RealtorOfferNegotiationModal } from '@/components/realtor/offers/RealtorOfferNegotiationModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
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
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<RealtorOffer[]>([]);
  const [messagesByOffer, setMessagesByOffer] = useState<Record<string, OfferThreadMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'realtor') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setOffers(mockOffers);
      setMessagesByOffer(initialMessages);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'countered', label: 'Countered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offers</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {offers.length} offer{offers.length === 1 ? '' : 's'} on behalf of your clients
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by listing..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === option.value
                        ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOffers.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Handshake className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {offers.length === 0 ? 'No offers yet' : 'No offers match your filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
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
          </div>
        </main>
      </div>

      <RealtorOfferNegotiationModal
        offer={activeOffer}
        messages={activeOfferId ? messagesByOffer[activeOfferId] || [] : []}
        onClose={() => setActiveOfferId(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        onCounter={handleCounter}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
