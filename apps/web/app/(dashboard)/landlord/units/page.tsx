'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { UnitsTable } from '@/components/landlord/units/UnitsTable';
import { AddUnitModal } from '@/components/landlord/units/AddUnitModal';
import { Button } from '@/components/ui/Button';
import { landlordService } from '@/services/landlordService';
import type { Property, Unit } from '@/types/landlord';

export default function LandlordUnitsPage() {
  return (
    <Suspense fallback={null}>
      <LandlordUnitsPageContent />
    </Suspense>
  );
}

function LandlordUnitsPageContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>(
    searchParams.get('property') || 'all'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [propertiesRes, unitsRes] = await Promise.all([
        landlordService.listProperties(),
        landlordService.listUnits(),
      ]);
      if (propertiesRes.success && propertiesRes.data) setProperties(propertiesRes.data);
      if (unitsRes.success && unitsRes.data) setUnits(unitsRes.data);
    };

    fetchData();
  }, []);

  const handleMarkVacant = async (unitId: string) => {
    const response = await landlordService.markUnitVacant(unitId);
    if (response.success && response.data) {
      setUnits((prev) => prev.map((u) => (u.id === unitId ? response.data! : u)));
    }
  };

  const handleAssignTenant = async (unitId: string, tenantName: string) => {
    const response = await landlordService.assignUnitTenant(unitId, tenantName);
    if (response.success && response.data) {
      setUnits((prev) => prev.map((u) => (u.id === unitId ? response.data! : u)));
    }
  };

  const handleAddUnit = async (
    data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>
  ) => {
    const { propertyId, unitName, bedrooms, bathrooms, monthlyRent } = data;
    const response = await landlordService.createUnit({
      propertyId,
      unitName,
      bedrooms,
      bathrooms,
      monthlyRent,
    });
    if (response.success && response.data) {
      setUnits((prev) => [response.data!, ...prev]);
    }
  };

  const filteredUnits = units.filter((u) => {
    const matchesProperty = propertyFilter === 'all' || u.propertyId === propertyFilter;
    const matchesSearch =
      u.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProperty && matchesSearch;
  });

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
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search units or tenants..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
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
        </select>
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
