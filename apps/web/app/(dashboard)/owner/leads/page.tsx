'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users } from 'lucide-react';
import { BuyerLeadCard } from '@/components/owner/leads/BuyerLeadCard';
import { ScheduleViewingModal } from '@/components/owner/leads/ScheduleViewingModal';
import { AssignRealtorModal } from '@/components/owner/leads/AssignRealtorModal';
import type { BuyerLead, BuyerLeadStage } from '@/types/owner';
import { ROUTES } from '@/lib/constants/auth';

const mockLeads: BuyerLead[] = [
  {
    id: 'lead_001',
    buyerName: 'Emeka Chukwu',
    email: 'emeka.chukwu@example.com',
    phone: '+234 803 555 0142',
    propertyId: 'oprop_002',
    propertyName: 'Palm Court Villa',
    inquiryDate: '2026-08-05T09:00:00.000Z',
    trustScore: 87,
    verified: true,
    stage: 'offer_made',
  },
  {
    id: 'lead_002',
    buyerName: 'Ngozi Adeyemi',
    email: 'ngozi.adeyemi@example.com',
    phone: '+234 802 444 7781',
    propertyId: 'oprop_001',
    propertyName: 'Ocean View Towers',
    inquiryDate: '2026-08-06T13:10:00.000Z',
    trustScore: 74,
    verified: true,
    stage: 'viewing_scheduled',
  },
  {
    id: 'lead_003',
    buyerName: 'David Okoro',
    email: 'david.okoro@example.com',
    phone: '+234 701 233 9090',
    propertyId: 'oprop_001',
    propertyName: 'Ocean View Towers',
    inquiryDate: '2026-08-04T16:45:00.000Z',
    trustScore: 62,
    verified: false,
    stage: 'contacted',
  },
  {
    id: 'lead_004',
    buyerName: 'Blessing Eze',
    email: 'blessing.eze@example.com',
    phone: '+234 909 112 6633',
    propertyId: 'oprop_002',
    propertyName: 'Palm Court Villa',
    inquiryDate: '2026-08-07T08:20:00.000Z',
    trustScore: 91,
    verified: true,
    stage: 'new',
  },
];

type StageFilter = 'all' | BuyerLeadStage;

export default function OwnerLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<BuyerLead[]>(mockLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');
  const [schedulingLead, setSchedulingLead] = useState<BuyerLead | null>(null);
  const [assigningLead, setAssigningLead] = useState<BuyerLead | null>(null);

  const updateStage = (leadId: string, stage: BuyerLeadStage) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
  };

  const handleMessage = (lead: BuyerLead) => {
    router.push(`${ROUTES.OWNER_MESSAGES}?lead=${lead.id}`);
  };

  const handleScheduleConfirm = (leadId: string) => {
    updateStage(leadId, 'viewing_scheduled');
  };

  const handleAssignRealtor = (leadId: string, realtorName: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, assignedRealtor: realtorName } : l))
    );
  };

  const handleConvertToOffer = (lead: BuyerLead) => {
    updateStage(lead.id, 'offer_made');
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || l.stage === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StageFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
    { value: 'offer_made', label: 'Offer Made' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Buyer Leads</h1>
        <p className="text-muted-foreground mt-1">
          {leads.length} inquir{leads.length === 1 ? 'y' : 'ies'} across your sale listings
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
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {leads.length === 0 ? 'No buyer leads yet' : 'No leads match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {leads.length === 0
              ? 'Inquiries from buyers on your published sale listings will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeads.map((lead, index) => (
            <BuyerLeadCard
              key={lead.id}
              lead={lead}
              delay={index * 0.05}
              onMessage={() => handleMessage(lead)}
              onScheduleViewing={() => setSchedulingLead(lead)}
              onConvertToOffer={() => handleConvertToOffer(lead)}
              onAssignRealtor={() => setAssigningLead(lead)}
            />
          ))}
        </div>
      )}

      <ScheduleViewingModal
        lead={schedulingLead}
        onClose={() => setSchedulingLead(null)}
        onSchedule={(leadId) => handleScheduleConfirm(leadId)}
      />

      <AssignRealtorModal
        lead={assigningLead}
        onClose={() => setAssigningLead(null)}
        onAssign={handleAssignRealtor}
      />
    </>
  );
}
