'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { LegacySelect } from '@/components/ui/LegacySelect';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { UnitsTable } from '@/components/landlord/units/UnitsTable';
import { AddUnitModal } from '@/components/landlord/units/AddUnitModal';
import { Button } from '@/components/ui/Button';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Unit } from '@/types/landlord';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>(
    searchParams.get('property') || 'all'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: landlordKeys.properties,
    queryFn: () => unwrap(landlordService.listProperties()),
  });

  const { data: units = [] } = useQuery({
    queryKey: landlordKeys.units(),
    queryFn: () => unwrap(landlordService.listUnits()),
  });

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

  const filteredUnits = useMemo(
    () =>
      units.filter((u) => {
        const matchesProperty = propertyFilter === 'all' || u.propertyId === propertyFilter;
        const matchesSearch =
          u.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProperty && matchesSearch;
      }),
    [units, propertyFilter, searchQuery]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Units</h1>
          <p className="text-muted-foreground mt-1">
            {units.length} units across {properties.length} propert
            {properties.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
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
          onChange={(e) => setPropertyFilter(e.target.value)}
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
        units={filteredUnits}
        onMarkVacant={handleMarkVacant}
        onAssignTenant={handleAssignTenant}
      />

      <AddUnitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        properties={properties}
        defaultPropertyId={propertyFilter !== 'all' ? propertyFilter : undefined}
        onSave={handleAddUnit}
      />
    </>
  );
}
