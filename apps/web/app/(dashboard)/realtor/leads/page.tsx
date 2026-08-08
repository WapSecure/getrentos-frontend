'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { LeadCard } from '@/components/realtor/leads/LeadCard';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { RealtorLead, LeadStage } from '@/types/realtor';

const mockLeads: RealtorLead[] = [
  {
    id: 'lead_001',
    leadName: 'Ngozi Adeyemi',
    leadType: 'buyer',
    email: 'ngozi@example.com',
    phone: '+234 802 444 7781',
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
    phone: '+234 701 233 9090',
    listingId: 'listing_002',
    listingTitle: 'Modern 2-Bed Flat, Ikeja GRA',
    trustScore: 74,
    verified: true,
    stage: 'contacted',
    inquiryDate: '2026-08-05T09:00:00.000Z',
  },
  {
    id: 'lead_003',
    leadName: 'Blessing Eze',
    leadType: 'buyer',
    email: 'blessing@example.com',
    phone: '+234 909 112 6633',
    listingId: 'listing_003',
    listingTitle: 'Spacious 4-Bed Duplex in Lekki',
    trustScore: 91,
    verified: true,
    stage: 'new',
    inquiryDate: '2026-08-07T08:20:00.000Z',
  },
];

type StageFilter = 'all' | LeadStage;

export default function RealtorLeadsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<RealtorLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');

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
      setLeads(mockLeads);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const updateStage = (leadId: string, stage: LeadStage) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.listingTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || l.stage === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filterOptions: { value: StageFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
    { value: 'offer_made', label: 'Offer Made' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {leads.length} lead{leads.length === 1 ? '' : 's'} across your listings
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by lead or listing..."
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

            {filteredLeads.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {leads.length === 0
                    ? 'Inquiries from buyers and renters on your published listings will appear here.'
                    : 'Try adjusting your search or filter.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLeads.map((lead, index) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    delay={index * 0.05}
                    onMessage={() => router.push(`/realtor/messages?lead=${lead.id}`)}
                    onScheduleViewing={() => router.push(`/realtor/viewings?lead=${lead.id}`)}
                    onConvertToOffer={() => {
                      updateStage(lead.id, 'offer_made');
                      router.push(`/realtor/offers?lead=${lead.id}`);
                    }}
                    onCloseWon={() => updateStage(lead.id, 'closed_won')}
                    onCloseLost={() => updateStage(lead.id, 'closed_lost')}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
