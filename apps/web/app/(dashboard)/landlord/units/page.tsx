'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Search, Tag } from 'lucide-react';
import { UnitsTable } from '@/components/landlord/units/UnitsTable';
import { AddUnitModal } from '@/components/landlord/units/AddUnitModal';
import { BulkChargeModal } from '@/components/landlord/units/BulkChargeModal';
import { BulkPricingModal } from '@/components/landlord/units/BulkPricingModal';
import { Button, Pagination } from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Unit } from '@/types/landlord';

const PAGE_SIZE = 10;

export default function LandlordUnitsPage() {
  return (
    <Suspense fallback={null}>
      <LandlordUnitsPageContent />
    </Suspense>
  );
}

function LandlordUnitsPageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>(
    searchParams.get('property') || 'all'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkChargeOpen, setIsBulkChargeOpen] = useState(false);
  const [isBulkPricingOpen, setIsBulkPricingOpen] = useState(false);

  // Debounce the search input; reset to page 1 inside the timer callback.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: propertiesData } = useQuery({
    queryKey: [...landlordKeys.properties, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(landlordService.listProperties({ page: 1, pageSize: 100 })),
  });
  const properties = propertiesData?.items ?? [];
  const totalProperties = propertiesData?.total ?? 0;

  // Fetch one row solely to read the portfolio-wide count. Bulk-action
  // modals load their own paginated unit lists rather than treating a 100-row
  // batch as the full portfolio.
  const { data: unitsSummaryData } = useQuery({
    queryKey: [...landlordKeys.units(), { page: 1, pageSize: 1 }],
    queryFn: () => unwrap(landlordService.listUnits({ page: 1, pageSize: 1 })),
  });
  const totalUnits = unitsSummaryData?.total ?? 0;

  // Paginated, server-filtered list for the table.
  const { data } = useQuery({
    queryKey: [
      ...landlordKeys.units(),
      {
        search: debouncedSearch,
        propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listUnits({
          search: debouncedSearch || undefined,
          propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const units = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateUnits = () => queryClient.invalidateQueries({ queryKey: landlordKeys.units() });

  const markVacantMutation = useMutation({
    mutationFn: (unitId: string) => unwrap(landlordService.markUnitVacant(unitId)),
    onSuccess: invalidateUnits,
  });

  const assignTenantMutation = useMutation({
    mutationFn: ({ unitId, tenantName }: { unitId: string; tenantName: string }) =>
      unwrap(landlordService.assignUnitTenant(unitId, tenantName)),
    onSuccess: invalidateUnits,
  });

  const addUnitMutation = useMutation({
    mutationFn: (data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>) => {
      const { propertyId, unitName, bedrooms, bathrooms, monthlyRent } = data;
      return unwrap(
        landlordService.createUnit({ propertyId, unitName, bedrooms, bathrooms, monthlyRent })
      );
    },
    onSuccess: invalidateUnits,
  });

  const handleMarkVacant = (unitId: string) => markVacantMutation.mutate(unitId);

  const handleAssignTenant = (unitId: string, tenantName: string) =>
    assignTenantMutation.mutate({ unitId, tenantName });

  const handleAddUnit = (data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>) =>
    addUnitMutation.mutate(data);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Units</h1>
          <p className="text-muted-foreground mt-1">
            {totalUnits} units across {totalProperties} propert
            {totalProperties === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsBulkPricingOpen(true)}
            disabled={totalUnits === 0}
          >
            <Tag className="w-4 h-4" />
            Bulk pricing
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsBulkChargeOpen(true)}
            disabled={totalUnits === 0}
          >
            <Receipt className="w-4 h-4" />
            Bulk charge
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setIsAddModalOpen(true)}
            disabled={properties.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search units or tenants..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <LegacySelect
          value={propertyFilter}
          onChange={(e) => {
            setPropertyFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </LegacySelect>
      </div>

      <UnitsTable
        units={units}
        onMarkVacant={handleMarkVacant}
        onAssignTenant={handleAssignTenant}
      />

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <AddUnitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        properties={properties}
        defaultPropertyId={propertyFilter !== 'all' ? propertyFilter : undefined}
        onSave={handleAddUnit}
      />

      <BulkChargeModal
        isOpen={isBulkChargeOpen}
        onClose={() => setIsBulkChargeOpen(false)}
        properties={properties}
      />

      <BulkPricingModal
        isOpen={isBulkPricingOpen}
        onClose={() => setIsBulkPricingOpen(false)}
        properties={properties}
      />
    </>
  );
}
