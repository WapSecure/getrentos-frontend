'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Handshake } from 'lucide-react';
import { OwnerNavbar } from '@/components/owner/navigation/OwnerNavbar';
import { OwnerSidebar } from '@/components/owner/dashboard/OwnerSidebar';
import { OfferCard } from '@/components/owner/offers/OfferCard';
import { OfferNegotiationModal } from '@/components/owner/offers/OfferNegotiationModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { SaleOffer, OfferStatus, OfferMessage } from '@/types/owner';

const mockOffers: SaleOffer[] = [
  {
    id: 'offer_001',
    buyerId: 'lead_001',
    buyerName: 'Emeka Chukwu',
    propertyId: 'oprop_002',
    propertyName: 'Palm Court Villa',
    offerAmount: 85_000_000,
    askingPrice: 95_000_000,
    financingType: 'mortgage',
    depositAmount: 8_500_000,
    message: 'Pre-approved for mortgage financing, ready to move quickly.',
    status: 'submitted',
    submittedAt: '2026-08-07T09:30:00.000Z',
  },
  {
    id: 'offer_002',
    buyerId: 'lead_005',
    buyerName: 'Chioma Adaobi',
    propertyId: 'oprop_001',
    propertyName: 'Ocean View Towers',
    offerAmount: 140_000_000,
    askingPrice: 148_000_000,
    financingType: 'cash',
    depositAmount: 14_000_000,
    status: 'countered',
    submittedAt: '2026-08-04T11:00:00.000Z',
  },
];

const initialMessages: Record<string, OfferMessage[]> = {
  offer_001: [
    {
      id: 'm1',
      offerId: 'offer_001',
      senderId: 'buyer',
      senderName: 'Emeka Chukwu',
      type: 'offer',
      amount: 85_000_000,
      text: 'Submitted an offer of',
      timestamp: '2026-08-07T09:30:00.000Z',
    },
    {
      id: 'm2',
      offerId: 'offer_001',
      senderId: 'buyer',
      senderName: 'Emeka Chukwu',
      type: 'message',
      text: 'Pre-approved for mortgage financing, ready to move quickly.',
      timestamp: '2026-08-07T09:31:00.000Z',
    },
  ],
  offer_002: [
    {
      id: 'm1',
      offerId: 'offer_002',
      senderId: 'buyer',
      senderName: 'Chioma Adaobi',
      type: 'offer',
      amount: 138_000_000,
      text: 'Submitted an offer of',
      timestamp: '2026-08-04T11:00:00.000Z',
    },
    {
      id: 'm2',
      offerId: 'offer_002',
      senderId: 'owner',
      senderName: 'You',
      type: 'counter',
      amount: 140_000_000,
      text: 'Countered with',
      timestamp: '2026-08-05T10:00:00.000Z',
    },
  ],
};

type StatusFilter = 'all' | OfferStatus;

export default function OwnerOffersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<SaleOffer[]>([]);
  const [messagesByOffer, setMessagesByOffer] = useState<Record<string, OfferMessage[]>>({});
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
        if (parsedUser.role && parsedUser.role !== 'owner') {
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

  const appendMessage = (offerId: string, message: OfferMessage) => {
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
      senderId: 'owner',
      senderName: 'You',
      type: 'accepted',
      text: 'Offer accepted',
      timestamp: new Date().toISOString(),
    });
  };

  const handleReject = (offerId: string) => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'rejected' } : o)));
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
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'countered', offerAmount: amount } : o))
    );
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

  const filteredOffers = offers.filter((o) => {
    const matchesSearch =
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
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
      <OwnerNavbar user={user} />

      <div className="flex">
        <OwnerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offers</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {offers.length} offer{offers.length === 1 ? '' : 's'} across your sale listings
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by buyer or property..."
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
                    ? 'Offers submitted by buyers on your published sale listings will appear here.'
                    : 'Try adjusting your search or filter.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOffers.map((offer, index) => (
                  <OfferCard
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

      <OfferNegotiationModal
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
