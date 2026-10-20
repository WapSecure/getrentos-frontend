'use client';

import { Button, EmptyState, Pagination, SearchInput, Select, useToast } from '@getrentos/ui';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Tag, DoorClosed } from 'lucide-react';
import { UnitsTable } from '@/components/landlord/units/UnitsTable';
import { AddUnitModal } from '@/components/landlord/units/AddUnitModal';
import { BulkChargeModal } from '@/components/landlord/units/BulkChargeModal';
import { ChargeUnitModal, type ChargeUnitInput } from '@/components/landlord/units/ChargeUnitModal';
import { BulkPricingModal } from '@/components/landlord/units/BulkPricingModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { ListState } from '@/components/shared/ListState';
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
  const [chargingUnit, setChargingUnit] = useState<Unit | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const toast = useToast();

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
  const {
    data,
    isPending: isLoadingUnits,
    isError: unitsFailed,
    refetch: refetchUnits,
  } = useQuery({
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
    placeholderData: keepPreviousData,
  });
  const units = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateUnits = () => queryClient.invalidateQueries({ queryKey: landlordKeys.units() });

  const markVacantMutation = useMutation({
    mutationFn: (unitId: string) => unwrap(landlordService.markUnitVacant(unitId)),
    onSuccess: () => {
      invalidateUnits();
      toast.success('Tenant removed and unit marked vacant.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assignTenantMutation = useMutation({
    mutationFn: ({ unitId, tenantName }: { unitId: string; tenantName: string }) =>
      unwrap(landlordService.assignUnitTenant(unitId, tenantName)),
    onSuccess: () => {
      invalidateUnits();
      toast.success('Tenant assigned to the unit.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addUnitMutation = useMutation({
    mutationFn: (data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>) => {
      const { propertyId, unitName, bedrooms, bathrooms, askingRent, askingRentPeriod } = data;
      return unwrap(
        landlordService.createUnit({
          propertyId,
          unitName,
          bedrooms,
          bathrooms,
          askingRent,
          askingRentPeriod,
        })
      );
    },
    onSuccess: () => {
      invalidateUnits();
      toast.success('Unit added.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleMarkVacant = (unitId: string) =>
    markVacantMutation.mutateAsync(unitId).then(() => undefined);

  const handleAssignTenant = (unitId: string, tenantName: string) =>
    assignTenantMutation.mutateAsync({ unitId, tenantName }).then(() => undefined);

  const handleAddUnit = async (
    data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>
  ) => {
    try {
      await addUnitMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  // Single-unit charging: available on every plan, unlike the bulk variant.
  const chargeUnitMutation = useMutation({
    mutationFn: (input: ChargeUnitInput) => unwrap(landlordService.chargeUnit(input)),
    onSuccess: () => {
      invalidateUnits();
      setChargingUnit(null);
      setChargeError(null);
      toast.success('Charge raised and the tenant notified.');
    },
    onError: (error: Error) => setChargeError(error.message),
  });

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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkPricingOpen(true)}
            disabled={totalUnits === 0}
            icon={<Tag className="w-4 h-4" />}
          >
            Bulk pricing
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBulkChargeOpen(true)}
            disabled={totalUnits === 0}
            icon={<Receipt className="w-4 h-4" />}
          >
            Bulk charge
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            disabled={properties.length === 0}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Unit
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search units or tenants..."
          label="Search units"
          className="flex-1 max-w-sm"
        />
        <Select
          value={propertyFilter}
          onValueChange={(value) => {
            setPropertyFilter(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All Properties' },
            ...properties.map((p) => ({ value: p.id, label: p.name })),
          ]}
          searchable={properties.length > 8}
          ariaLabel="Filter by property"
          className="sm:w-56"
        />
      </div>

      <ListState
        items={units}
        query={{ isPending: isLoadingUnits, isError: unitsFailed, refetch: refetchUnits }}
        errorTitle="We couldn't load your units"
        skeletonClassName="h-16"
        skeletonRows={4}
        empty={
          <EmptyState icon={DoorClosed} title="No units found" />
        }
      >
        <UnitsTable
          units={units}
          onMarkVacant={handleMarkVacant}
          onAssignTenant={handleAssignTenant}
          onChargeUnit={setChargingUnit}
          pendingUnitId={
            markVacantMutation.isPending
              ? markVacantMutation.variables
              : assignTenantMutation.isPending
                ? assignTenantMutation.variables?.unitId
                : undefined
          }
        />
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

      <AddUnitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        properties={properties}
        defaultPropertyId={propertyFilter !== 'all' ? propertyFilter : undefined}
        onSave={handleAddUnit}
      />

      <ChargeUnitModal
        unit={chargingUnit}
        onClose={() => {
          setChargingUnit(null);
          setChargeError(null);
        }}
        onCharge={(input) => chargeUnitMutation.mutate(input)}
        isPending={chargeUnitMutation.isPending}
        errorMessage={chargeError}
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
