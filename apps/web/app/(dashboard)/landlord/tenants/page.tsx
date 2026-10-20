'use client';

import { Pagination, EmptyState, SearchInput } from '@getrentos/ui';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { TenantCard } from '@/components/landlord/tenants/TenantCard';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { ListState } from '@/components/shared/ListState';
import type { RentPaymentStatus } from '@/types/landlord';

const rentStatusFilters: { value: 'all' | RentPaymentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const PAGE_SIZE = 10;

export default function LandlordTenantsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rentFilter, setRentFilter] = useState<'all' | RentPaymentStatus>('all');

  // The tenants endpoint does not accept search/status params, so search and
  // rent-status filtering stay client-side on the current page.
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...landlordKeys.tenants, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(landlordService.listTenants({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const tenants = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const filteredTenants = useMemo(
    () =>
      tenants.filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = rentFilter === 'all' || t.rentStatus === rentFilter;
        return matchesSearch && matchesFilter;
      }),
    [tenants, searchQuery, rentFilter]
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
        {/* Zero is a claim about the portfolio, so wait until it has been read
            before making it. */}
        <p className="text-muted-foreground mt-1">
          {isPending
            ? 'Counting your tenants…'
            : `${total} tenant${total === 1 ? '' : 's'} across your portfolio`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search tenants or properties..."
          className="flex-1 max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {rentStatusFilters.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setRentFilter(option.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                rentFilter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ListState
        items={filteredTenants}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your tenants"
        empty={<EmptyState icon={Users} title="No tenants match your filters" />}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenants.map((tenant, index) => (
            <TenantCard key={tenant.id} tenant={tenant} delay={index * 0.05} />
          ))}
        </div>
      </ListState>

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
