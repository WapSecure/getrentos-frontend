'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { BuyerLeadCard } from '@/components/owner/leads/BuyerLeadCard';
import { ScheduleViewingModal } from '@/components/owner/leads/ScheduleViewingModal';
import { AssignRealtorModal } from '@/components/owner/leads/AssignRealtorModal';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { BuyerLead, BuyerLeadStage } from '@/types/owner';
import { ROUTES } from '@/lib/constants/auth';

type StageFilter = 'all' | BuyerLeadStage;

export default function OwnerLeadsPage() {
  const router = useRouter();
  const { data: leads = [] } = useQuery({
    queryKey: ownerKeys.leads,
    queryFn: () => unwrap(ownerService.listLeads()),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');
  const [schedulingLead, setSchedulingLead] = useState<BuyerLead | null>(null);
  const [assigningLead, setAssigningLead] = useState<BuyerLead | null>(null);

  const handleMessage = (lead: BuyerLead) => {
    router.push(`${ROUTES.OWNER_MESSAGES}?lead=${lead.id}`);
  };

  // Lead-stage updates (schedule/assign/convert) are tracked server-side via
  // viewings & offers; these handlers keep the modal flow responsive locally.
  const handleScheduleConfirm = (_leadId: string) => {
    setSchedulingLead(null);
  };

  const handleAssignRealtor = (_leadId: string, _realtorName: string) => {
    setAssigningLead(null);
  };

  const handleConvertToOffer = (_lead: BuyerLead) => {
    setSchedulingLead(null);
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
