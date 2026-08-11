'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus } from 'lucide-react';
import { LeadCard } from '@/components/realtor/leads/LeadCard';
import type { RealtorLead, LeadStage } from '@/types/realtor';
import { ROUTES } from '@/lib/constants/auth';

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
  const [leads, setLeads] = useState<RealtorLead[]>(mockLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');

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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground mt-1">
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

      {filteredLeads.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
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
              onMessage={() => router.push(`${ROUTES.REALTOR_MESSAGES}?lead=${lead.id}`)}
              onScheduleViewing={() => router.push(`${ROUTES.REALTOR_VIEWINGS}?lead=${lead.id}`)}
              onConvertToOffer={() => {
                updateStage(lead.id, 'offer_made');
                router.push(`${ROUTES.REALTOR_OFFERS}?lead=${lead.id}`);
              }}
              onCloseWon={() => updateStage(lead.id, 'closed_won')}
              onCloseLost={() => updateStage(lead.id, 'closed_lost')}
            />
          ))}
        </div>
      )}
    </>
  );
}
