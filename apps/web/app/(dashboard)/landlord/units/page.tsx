'use client';

import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ReceiptText, Tag, DoorClosed, Building2, MapPin } from '@sureground/icons';
import { UnitsTable } from '@/components/landlord/units/UnitsTable';
import {
  RecordOccupierModal,
  type OccupierRecord,
} from '@/components/landlord/units/RecordOccupierModal';
import { AddUnitModal } from '@/components/landlord/units/AddUnitModal';
import { BulkChargeModal } from '@/components/landlord/units/BulkChargeModal';
import { ChargeUnitModal, type ChargeUnitInput } from '@/components/landlord/units/ChargeUnitModal';
import { BulkPricingModal } from '@/components/landlord/units/BulkPricingModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { ListState } from '@/components/shared/ListState';
import { landlordKeys } from '@/lib/queryKeys';
import type { Property, Unit } from '@/types/landlord';
import {
  RecordFacts,
  RecordIconTile,
  RecordToolbar,
} from '@/components/shared/records/RecordParts';
import { verificationBadges } from '@/lib/statusBadge';
import { formatCurrency, pluralize } from '@/lib/format';

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
  const [recordingUnit, setRecordingUnit] = useState<Unit | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const toast = useToast();

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
  const selectedProperty =
    propertyFilter !== 'all' ? properties.find((p) => p.id === propertyFilter) : undefined;

  // One row, only for the portfolio-wide count.
  const { data: unitsSummaryData } = useQuery({
    queryKey: [...landlordKeys.units(), { page: 1, pageSize: 1 }],
    queryFn: () => unwrap(landlordService.listUnits({ page: 1, pageSize: 1 })),
  });
  const totalUnits = unitsSummaryData?.total ?? 0;

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

  const recordOccupierMutation = useMutation({
    mutationFn: ({ unitId, record }: { unitId: string; record: OccupierRecord }) =>
      unwrap(
        landlordService.createLease(
          {
            unitId,
            tenantName: record.tenantName,
            leaseStart: record.leaseStart,
            leaseEnd: record.leaseEnd,
            rentAmount: record.rentAmount,
            rentPeriod: record.rentPeriod,
            securityDeposit: 0,
            recordExisting: true,
          },
          false
        )
      ),
    onSuccess: () => {
      invalidateUnits();
      queryClient.invalidateQueries({ queryKey: landlordKeys.leases() });
      setRecordingUnit(null);
      setRecordError(null);
      toast.success('Tenancy recorded for this unit.');
    },
    onError: (error: Error) => {
      setRecordError(error.message);
      toast.error(error.message);
    },
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

  const handleRecordOccupier = (unitId: string, record: OccupierRecord) =>
    recordOccupierMutation.mutateAsync({ unitId, record }).then(() => undefined);
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
      <PageHeader
        eyebrow="Portfolio"
        title="Units"
        description={
          <>
            {pluralize(totalUnits, 'unit')} across{' '}
            {pluralize(totalProperties, 'property', 'properties')}
          </>
        }
        actions={
          <>
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
              icon={<ReceiptText className="w-4 h-4" />}
            >
              Bulk charge
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              disabled={properties.length === 0}
              icon={<Plus className="w-4 h-4" />}
            >
              Add unit
            </Button>
          </>
        }
      />

      {selectedProperty && <PropertySummary property={selectedProperty} />}

      <RecordToolbar>
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search units or tenants..."
          label="Search units"
          className="flex-1 sm:max-w-sm"
        />
        <Select
          value={propertyFilter}
          onValueChange={(value) => {
            setPropertyFilter(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All properties' },
            ...properties.map((p) => ({ value: p.id, label: p.name })),
          ]}
          searchable={properties.length > 8}
          ariaLabel="Filter by property"
          className="sm:ml-auto sm:w-56"
        />
      </RecordToolbar>

      <ListState
        items={units}
        query={{ isPending: isLoadingUnits, isError: unitsFailed, refetch: refetchUnits }}
        errorTitle="We couldn't load your units"
        skeletonClassName="h-16"
        skeletonRows={4}
        empty={
          <EmptyState
            icon={DoorClosed}
            title="No units found"
            description={
              properties.length === 0
                ? 'Add a property first, then add its units here.'
                : 'Units you add appear here with their tenant and rent.'
            }
          />
        }
      >
        <UnitsTable
          units={units}
          onMarkVacant={handleMarkVacant}
          onRecordOccupier={setRecordingUnit}
          onChargeUnit={setChargingUnit}
          pendingUnitId={markVacantMutation.isPending ? markVacantMutation.variables : undefined}
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

      <RecordOccupierModal
        unit={recordingUnit}
        onClose={() => {
          setRecordingUnit(null);
          setRecordError(null);
        }}
        onRecord={handleRecordOccupier}
        isPending={recordOccupierMutation.isPending}
        errorMessage={recordError}
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

/** The chosen property's title block and key facts, from the list already loaded for the filter. */
function PropertySummary({ property }: { property: Property }) {
  const verification = verificationBadges[property.verificationStatus];
  const vacant = Math.max(property.totalUnits - property.occupiedUnits, 0);
  return (
    <section
      aria-label={`${property.name} summary`}
      className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RecordIconTile icon={Building2} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">{property.name}</h2>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
              {property.city}, {property.state}
            </p>
          </div>
        </div>
        <Badge
          variant={verification.variant}
          icon={verification.icon ? <verification.icon className="h-3 w-3" /> : undefined}
        >
          {verification.label}
        </Badge>
      </div>
      <RecordFacts
        columns={3}
        facts={[
          { label: 'Units', value: property.totalUnits },
          { label: 'Occupied', value: `${property.occupiedUnits} (${vacant} vacant)` },
          {
            label: 'Rent roll',
            value: `${formatCurrency(property.annualRentRoll, { compact: true })}/yr`,
            tone: 'brand',
          },
        ]}
      />
    </section>
  );
}
