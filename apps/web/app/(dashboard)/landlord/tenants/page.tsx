'use client';

import { LegacyInput } from '@getrentos/ui';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { TenantCard } from '@/components/landlord/tenants/TenantCard';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { RentPaymentStatus } from '@/types/landlord';

const rentStatusFilters: { value: 'all' | RentPaymentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

export default function LandlordTenantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [rentFilter, setRentFilter] = useState<'all' | RentPaymentStatus>('all');

  const { data: tenants = [] } = useQuery({
    queryKey: landlordKeys.tenants,
    queryFn: () => unwrap(landlordService.listTenants()),
  });

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
        <p className="text-muted-foreground mt-1">
          {tenants.length} tenant{tenants.length === 1 ? '' : 's'} across your portfolio
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenants or properties..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {rentStatusFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => setRentFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                rentFilter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No tenants match your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenants.map((tenant, index) => (
            <TenantCard key={tenant.id} tenant={tenant} delay={index * 0.05} />
          ))}
        </div>
      )}
    </>
  );
}
