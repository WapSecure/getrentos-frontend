'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, CalendarClock } from 'lucide-react';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
import { ViewingRequestCard } from '@/components/buyer/viewings/ViewingRequestCard';
import { RequestViewingModal } from '@/components/buyer/viewings/RequestViewingModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { ViewingRequest, BuyerPropertyListing } from '@/types/buyer';

const mockListings: BuyerPropertyListing[] = [
  {
    id: 'listing_001',
    title: 'Luxury 3-Bed Apartment with Ocean Views',
    propertyType: 'Apartment',
    askingPrice: 148_000_000,
    address: '3 Bar Beach Way',
    city: 'Victoria Island',
    state: 'Lagos',
    features: [],
    description: '',
    ownerName: 'Adaeze Okafor',
    ownerVerified: true,
    listedDate: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'listing_002',
    title: 'Spacious 4-Bed Duplex in Lekki',
    propertyType: 'Duplex',
    askingPrice: 95_000_000,
    address: '18 Chevron Drive',
    city: 'Lekki',
    state: 'Lagos',
    features: [],
    description: '',
    ownerName: 'Adaeze Okafor',
    ownerVerified: true,
    listedDate: '2026-05-12T00:00:00.000Z',
  },
];

const mockViewingRequests: ViewingRequest[] = [
  {
    id: 'view_001',
    propertyId: 'listing_001',
    propertyTitle: 'Luxury 3-Bed Apartment with Ocean Views',
    requestedDate: '2026-08-09',
    requestedTime: '14:00',
    status: 'confirmed',
    notes: 'Would like to see the balcony view.',
  },
  {
    id: 'view_002',
    propertyId: 'listing_002',
    propertyTitle: 'Spacious 4-Bed Duplex in Lekki',
    requestedDate: '2026-08-12',
    requestedTime: '10:30',
    status: 'pending',
  },
];

function BuyerViewingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get('property') || undefined;

  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(!!defaultPropertyId);

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
        if (parsedUser.role && parsedUser.role !== 'buyer') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setRequests(mockViewingRequests);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = (propertyId: string, date: string, time: string, notes: string) => {
    const property = mockListings.find((l) => l.id === propertyId);
    const newRequest: ViewingRequest = {
      id: `view_${Date.now()}`,
      propertyId,
      propertyTitle: property?.title || 'Unknown property',
      requestedDate: date,
      requestedTime: time,
      status: 'pending',
      notes: notes || undefined,
    };
    setRequests((prev) => [newRequest, ...prev]);
  };

  const handleCancel = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r))
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <BuyerNavbar user={user} />

      <div className="flex">
        <BuyerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Viewing Requests
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {requests.length} request{requests.length === 1 ? '' : 's'}
                </p>
              </div>
              <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Request Viewing
              </Button>
            </div>

            {requests.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <CalendarClock className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No viewing requests yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Request a viewing from any property to schedule a tour with the owner.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {requests.map((request, index) => (
                  <ViewingRequestCard
                    key={request.id}
                    request={request}
                    delay={index * 0.05}
                    onCancel={() => handleCancel(request.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <RequestViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listings={mockListings}
        defaultPropertyId={defaultPropertyId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function BuyerViewingsPage() {
  return (
    <Suspense fallback={null}>
      <BuyerViewingsPageContent />
    </Suspense>
  );
}
