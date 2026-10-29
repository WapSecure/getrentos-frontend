'use client';

import {
  Button,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  SegmentedControl,
} from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { BuyerLeadCard } from '@/components/owner/leads/BuyerLeadCard';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { BuyerLead, BuyerLeadStage } from '@/types/owner';
import { ROUTES } from '@/lib/constants/auth';

type StageFilter = 'all' | BuyerLeadStage;

const PAGE_SIZE = 10;

export default function OwnerLeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const leadsQuery = useQuery({
    queryKey: [
      ...ownerKeys.leads,
      {
        search: debouncedSearch,
        stage: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listLeads({
          search: debouncedSearch || undefined,
          stage: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const { data } = leadsQuery;
  const leads = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilters = Boolean(debouncedSearch || filter !== 'all');

  const handleMessage = (lead: BuyerLead) => {
    router.push(`${ROUTES.OWNER_MESSAGES}?lead=${lead.id}`);
  };

  const filterOptions: { value: StageFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
    { value: 'offer_made', label: 'Offer Made' },
    { value: 'closed', label: 'Closed' },
    { value: 'lost', label: 'Lost' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Buyer Leads</h1>
        <p className="text-muted-foreground mt-1">
          {total} inquir{total === 1 ? 'y' : 'ies'} across your sale listings
        </p>
      </div>

      <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search by buyer or property..."
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <SegmentedControl
          size="sm"
          aria-label="Filter by stage"
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          segments={filterOptions}
          className="w-full min-w-0 max-w-full justify-start overflow-x-auto sm:w-auto"
        />
      </div>

      {leadsQuery.isLoading ? (
        <ListSkeleton rows={6} variant="cards" label="Loading leads" />
      ) : leadsQuery.isError && !data ? (
        <PageErrorState
          title="Buyer leads are unavailable"
          description="We could not load enquiries for your sale listings. Please try again."
          onRetry={() => void leadsQuery.refetch()}
          isRetrying={leadsQuery.isFetching}
        />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? 'No leads match your filters' : 'No buyer leads yet'}
          description={
            hasActiveFilters
              ? 'Clear the current filters to return to your full pipeline.'
              : 'Inquiries from buyers on your published sale listings will appear here.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead, index) => (
            <BuyerLeadCard
              key={lead.id}
              lead={lead}
              delay={index * 0.05}
              onMessage={() => handleMessage(lead)}
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
    </>
  );
}
