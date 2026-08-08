'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, CalendarClock } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { ViewingCard } from '@/components/realtor/viewings/ViewingCard';
import { ScheduleViewingModal } from '@/components/realtor/viewings/ScheduleViewingModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { ViewingAppointment, RealtorLead } from '@/types/realtor';

const mockLeads: RealtorLead[] = [
  {
    id: 'lead_001',
    leadName: 'Ngozi Adeyemi',
    leadType: 'buyer',
    email: 'ngozi@example.com',
    phone: '',
    listingId: 'listing_001',
    listingTitle: 'Luxury 3-Bed Apartment with Ocean Views',
    trustScore: 87,
    verified: true,
    stage: 'viewing_scheduled',
    inquiryDate: '2026-08-06T13:10:00.000Z',
  },
  {
    id: 'lead_002',
    leadName: 'David Okoro',
    leadType: 'renter',
    email: 'david@example.com',
    phone: '',
    listingId: 'listing_002',
    listingTitle: 'Modern 2-Bed Flat, Ikeja GRA',
    trustScore: 74,
    verified: true,
    stage: 'contacted',
    inquiryDate: '2026-08-05T09:00:00.000Z',
  },
];

const mockViewings: ViewingAppointment[] = [
  {
    id: 'view_001',
    leadName: 'Ngozi Adeyemi',
    listingId: 'listing_001',
    listingTitle: 'Luxury 3-Bed Apartment with Ocean Views',
    scheduledDate: '2026-08-10',
    scheduledTime: '11:00',
    status: 'confirmed',
  },
  {
    id: 'view_002',
    leadName: 'David Okoro',
    listingId: 'listing_002',
    listingTitle: 'Modern 2-Bed Flat, Ikeja GRA',
    scheduledDate: '2026-08-12',
    scheduledTime: '15:30',
    status: 'pending',
  },
];

function RealtorViewingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultLeadId = searchParams.get('lead') || undefined;

  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewings, setViewings] = useState<ViewingAppointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(!!defaultLeadId);

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
      setViewings(mockViewings);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = (appointment: Omit<ViewingAppointment, 'id' | 'status'>) => {
    const newViewing: ViewingAppointment = {
      ...appointment,
      id: `view_${Date.now()}`,
      status: 'pending',
    };
    setViewings((prev) => [newViewing, ...prev]);
  };

  const updateStatus = (id: string, status: ViewingAppointment['status']) => {
    setViewings((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
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
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Viewings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {viewings.length} scheduled tour{viewings.length === 1 ? '' : 's'}
                </p>
              </div>
              <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Schedule Viewing
              </Button>
            </div>

            {viewings.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <CalendarClock className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No viewings scheduled
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Schedule a tour with one of your leads to get started.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {viewings.map((viewing, index) => (
                  <ViewingCard
                    key={viewing.id}
                    viewing={viewing}
                    delay={index * 0.05}
                    onConfirm={() => updateStatus(viewing.id, 'confirmed')}
                    onComplete={() => updateStatus(viewing.id, 'completed')}
                    onCancel={() => updateStatus(viewing.id, 'cancelled')}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <ScheduleViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leads={mockLeads}
        defaultLeadId={defaultLeadId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function RealtorViewingsPage() {
  return (
    <Suspense fallback={null}>
      <RealtorViewingsPageContent />
    </Suspense>
  );
}
