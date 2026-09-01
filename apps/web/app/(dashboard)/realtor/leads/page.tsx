'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserPlus, User, Mail, Phone } from 'lucide-react';
import { LeadCard } from '@/components/realtor/leads/LeadCard';
import type { LeadStage } from '@/types/realtor';
import { ROUTES } from '@/lib/constants/auth';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  Pagination,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { nameOnly } from '@/lib/validations/input';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorLead, realtorService, type RealtorListingApi } from '@/services/realtorService';

type StageFilter = 'all' | LeadStage;

const PAGE_SIZE = 10;
const LISTING_SELECTOR_PAGE_SIZE = 10;

const LEAD_STAGE_TO_API_STATUS: Partial<
  Record<LeadStage, 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'LOST'>
> = {
  new: 'NEW',
  contacted: 'CONTACTED',
  viewing_scheduled: 'QUALIFIED',
  closed_won: 'CLOSED',
  closed_lost: 'LOST',
};

export default function RealtorLeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLead, setNewLead] = useState({ fullName: '', email: '', phone: '', listingId: '' });
  const [listingSearch, setListingSearch] = useState('');
  const [listingPage, setListingPage] = useState(1);
  const [selectedListingState, setSelectedListingState] = useState<RealtorListingApi | null>(null);
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
  }>({});
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const leadStatus = filter === 'all' ? undefined : LEAD_STAGE_TO_API_STATUS[filter];
  const { data, isLoading } = useQuery({
    queryKey: [
      ...realtorKeys.leads,
      { page, pageSize: PAGE_SIZE, search: searchQuery.trim() || undefined, status: leadStatus },
    ],
    queryFn: async () => {
      const result = await unwrap(
        realtorService.listLeads({
          page,
          pageSize: PAGE_SIZE,
          search: searchQuery.trim() || undefined,
          status: leadStatus,
        })
      );
      return { ...result, items: result.items.map(mapRealtorLead) };
    },
  });
  const leads = data?.items ?? [];
  const total = data?.total ?? 0;
  const queryClient = useQueryClient();
  const updateLead = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CLOSED' | 'LOST' }) =>
      unwrap(realtorService.updateLeadStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.leads }),
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to update this lead. Please try again.',
        variant: 'error',
      }),
  });
  const { data: listingsResult, isLoading: isListingsLoading } = useQuery({
    queryKey: [
      ...realtorKeys.listings,
      {
        page: listingPage,
        pageSize: LISTING_SELECTOR_PAGE_SIZE,
        search: listingSearch.trim() || undefined,
      },
    ],
    queryFn: async () => {
      return unwrap(
        realtorService.listListings({
          page: listingPage,
          pageSize: LISTING_SELECTOR_PAGE_SIZE,
          search: listingSearch.trim() || undefined,
        })
      );
    },
    enabled: isCreateOpen,
  });
  const listings = listingsResult?.items ?? [];
  const selectedListing =
    (selectedListingState?.id === newLead.listingId ? selectedListingState : null) ??
    listings.find((listing) => listing.id === newLead.listingId) ??
    null;
  const createLead = useMutation({
    mutationFn: () =>
      unwrap(realtorService.createLead({ ...newLead, listingId: newLead.listingId || undefined })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.leads });
      setPage(1);
      setNewLead({ fullName: '', email: '', phone: '', listingId: '' });
      setFormErrors({});
      setIsCreateOpen(false);
      setToast({ message: 'Lead created.', variant: 'success' });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to create this lead. Please try again.',
        variant: 'error',
      });
    },
  });

  const handleCreateLead = () => {
    const errors: typeof formErrors = {};
    if (!newLead.fullName.trim()) errors.fullName = 'Enter the lead’s full name.';
    if (newLead.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLead.email.trim())) {
      errors.email = 'Enter a valid email address, e.g. lead@example.com.';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) createLead.mutate();
  };

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setListingSearch('');
      setListingPage(1);
      setSelectedListingState(null);
      setNewLead({ fullName: '', email: '', phone: '', listingId: '' });
      setFormErrors({});
    }
  };

  const filterOptions: { value: StageFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
  ];

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            {total} lead{total === 1 ? '' : 's'} across your listings
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by lead or listing..."
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

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
          Loading leads…
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0 ? 'No leads yet' : 'No leads match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? 'Inquiries from buyers and renters on your published listings will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead, index) => (
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
      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
      <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent>
          <div className="p-5 space-y-4">
            <DialogTitle>Add lead</DialogTitle>
            <Field label="Full name" htmlFor="lead-full-name" required error={formErrors.fullName}>
              <Input
                id="lead-full-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Adaeze Okafor"
                leadingIcon={<User className="h-4 w-4" />}
                value={newLead.fullName}
                onChange={(event) =>
                  setNewLead((value) => ({ ...value, fullName: nameOnly(event.target.value) }))
                }
                disabled={createLead.isPending}
              />
            </Field>
            <Field label="Email" htmlFor="lead-email" error={formErrors.email}>
              <Input
                id="lead-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="lead@example.com"
                leadingIcon={<Mail className="h-4 w-4" />}
                value={newLead.email}
                onChange={(event) =>
                  setNewLead((value) => ({ ...value, email: event.target.value }))
                }
                disabled={createLead.isPending}
              />
            </Field>
            <Field label="Phone" htmlFor="lead-phone" error={formErrors.phone}>
              <Input
                id="lead-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0801 234 5678"
                leadingIcon={<Phone className="h-4 w-4" />}
                value={newLead.phone}
                onChange={(event) =>
                  setNewLead((value) => ({ ...value, phone: event.target.value }))
                }
                disabled={createLead.isPending}
              />
            </Field>
            <Field label="Listing" htmlFor="lead-listing">
              <PaginatedSelect
                value={newLead.listingId}
                onValueChange={(value) => {
                  setNewLead((lead) => ({ ...lead, listingId: value }));
                  setSelectedListingState(listings.find((listing) => listing.id === value) ?? null);
                }}
                items={listings}
                selectedItem={selectedListing}
                getItemValue={(listing) => listing.id}
                getItemLabel={(listing) => listing.listingTitle || listing.property.title}
                search={listingSearch}
                onSearchChange={(value) => {
                  setListingSearch(value);
                  setListingPage(1);
                }}
                searchPlaceholder="Search your listings"
                page={listingPage}
                pageSize={LISTING_SELECTOR_PAGE_SIZE}
                total={listingsResult?.total ?? 0}
                onPageChange={setListingPage}
                placeholder="Select a listing"
                emptyOption={{ value: '', label: 'No listing yet' }}
                emptyMessage="No managed listings match this search."
                isLoading={isListingsLoading}
                disabled={createLead.isPending}
                ariaLabel="listing"
              />
              {selectedListing && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedListing.property.title} · {selectedListing.property.city}
                </p>
              )}
            </Field>
            <Button
              fullWidth
              isLoading={createLead.isPending}
              disabled={!newLead.fullName.trim()}
              onClick={handleCreateLead}
            >
              Create lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
