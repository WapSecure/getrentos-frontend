'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserPlus } from 'lucide-react';
import { LeadCard } from '@/components/realtor/leads/LeadCard';
import type { LeadStage } from '@/types/realtor';
import { ROUTES } from '@/lib/constants/auth';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorLead, mapRealtorListing, realtorService } from '@/services/realtorService';

type StageFilter = 'all' | LeadStage;

export default function RealtorLeadsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLead, setNewLead] = useState({ fullName: '', email: '', phone: '', listingId: '' });
  const { data: leads = [], isLoading } = useQuery({
    queryKey: realtorKeys.leads,
    queryFn: async () => (await unwrap(realtorService.listLeads())).map(mapRealtorLead),
  });
  const queryClient = useQueryClient();
  const updateLead = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CLOSED' | 'LOST' }) =>
      unwrap(realtorService.updateLeadStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.leads }),
  });
  const { data: listings = [] } = useQuery({
    queryKey: realtorKeys.listings,
    queryFn: async () => (await unwrap(realtorService.listListings())).map(mapRealtorListing),
  });
  const createLead = useMutation({
    mutationFn: () =>
      unwrap(realtorService.createLead({ ...newLead, listingId: newLead.listingId || undefined })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.leads });
      setNewLead({ fullName: '', email: '', phone: '', listingId: '' });
      setIsCreateOpen(false);
    },
  });

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
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add lead
        </Button>
        <p className="text-muted-foreground mt-1">
          {leads.length} lead{leads.length === 1 ? '' : 's'} across your listings
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
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

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
          Loading leads…
        </div>
      ) : filteredLeads.length === 0 ? (
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
              onConvertToOffer={() => router.push(`${ROUTES.REALTOR_OFFERS}?lead=${lead.id}`)}
              onCloseWon={() => updateLead.mutate({ id: lead.id, status: 'CLOSED' })}
              onCloseLost={() => updateLead.mutate({ id: lead.id, status: 'LOST' })}
            />
          ))}
        </div>
      )}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <div className="p-5 space-y-3">
            <DialogTitle>Add lead</DialogTitle>
            {(['fullName', 'email', 'phone'] as const).map((field) => (
              <input
                key={field}
                value={newLead[field]}
                onChange={(event) =>
                  setNewLead((value) => ({ ...value, [field]: event.target.value }))
                }
                placeholder={
                  field === 'fullName'
                    ? 'Full name'
                    : field === 'email'
                      ? 'Email address'
                      : 'Phone number'
                }
                className="w-full rounded-lg border border-border bg-card px-3 py-2"
              />
            ))}
            <select
              value={newLead.listingId}
              onChange={(event) =>
                setNewLead((value) => ({ ...value, listingId: event.target.value }))
              }
              className="w-full rounded-lg border border-border bg-card px-3 py-2"
            >
              <option value="">No listing yet</option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>
            <Button
              fullWidth
              isLoading={createLead.isPending}
              disabled={!newLead.fullName}
              onClick={() => createLead.mutate()}
            >
              Create lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
