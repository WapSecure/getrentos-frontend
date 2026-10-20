'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, User, Mail, Phone } from 'lucide-react';
import { LeadCard } from '@/components/realtor/leads/LeadCard';
import type { LeadStage } from '@/types/realtor';
import { ROUTES } from '@/lib/constants/auth';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  EmptyState,
  Input,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
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
  const toast = useToast();
  const leadStatus = filter === 'all' ? undefined : LEAD_STAGE_TO_API_STATUS[filter];
  const leadsQuery = useQuery({
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
    placeholderData: keepPreviousData,
  });
  const { data, isLoading } = leadsQuery;
  const leads = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilters = Boolean(searchQuery.trim() || filter !== 'all');
  const queryClient = useQueryClient();
  const updateLead = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CLOSED' | 'LOST' }) =>
      unwrap(realtorService.updateLeadStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.leads }),
    onError: (error) =>
      toast.error(error.message || 'Unable to update this lead. Please try again.'),
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
    placeholderData: keepPreviousData,
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
      toast.success('Lead created.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to create this lead. Please try again.');
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            {total} lead{total === 1 ? '' : 's'} across your listings
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Add lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by lead or listing..."
          label="Search leads"
          className="flex-1 max-w-sm"
        />
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as StageFilter);
            setPage(1);
          }}
        >
          <TabsList className="max-w-full">
            {filterOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading leads" />
      ) : leadsQuery.isError && !data ? (
        <PageErrorState
          title="Leads are unavailable"
          description="We could not load your buyer and renter enquiries. Please try again."
          onRetry={() => void leadsQuery.refetch()}
          isRetrying={leadsQuery.isFetching}
        />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
          description={
            hasActiveFilters
              ? 'Clear the current filters to return to your full pipeline.'
              : 'Inquiries from buyers and renters on your published listings will appear here.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onMessage={() => router.push(`${ROUTES.REALTOR_MESSAGES}?lead=${lead.id}`)}
              onScheduleViewing={() => router.push(`${ROUTES.REALTOR_VIEWINGS}?lead=${lead.id}`)}
              onConvertToOffer={() => router.push(`${ROUTES.REALTOR_OFFERS}?lead=${lead.id}`)}
              onCloseWon={() => updateLead.mutate({ id: lead.id, status: 'CLOSED' })}
              onCloseLost={() => updateLead.mutate({ id: lead.id, status: 'LOST' })}
              isUpdating={updateLead.isPending && updateLead.variables?.id === lead.id}
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
        <DialogContent className="p-0">
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
    </>
  );
}
