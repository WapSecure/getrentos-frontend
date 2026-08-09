'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { UnitsTable } from '@/components/landlord/units/UnitsTable';
import { AddUnitModal } from '@/components/landlord/units/AddUnitModal';
import { Button } from '@/components/ui/Button';
import type { Property, Unit } from '@/types/landlord';

const mockProperties: Property[] = [
  {
    id: 'prop_001',
    name: 'Sunrise Apartments',
    type: 'apartment',
    address: '14 Adeola Odeku Street',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '',
    verificationStatus: 'verified',
    totalUnits: 8,
    occupiedUnits: 6,
    monthlyRevenue: 2_850_000,
    createdAt: '2024-11-02T00:00:00.000Z',
  },
  {
    id: 'prop_002',
    name: 'Palm Court Residences',
    type: 'duplex',
    address: '22 Admiralty Way',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '',
    verificationStatus: 'verified',
    totalUnits: 4,
    occupiedUnits: 3,
    monthlyRevenue: 1_620_000,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'prop_003',
    name: 'Modern Downtown Loft',
    type: 'shared_apartment',
    address: '5 Ikeja GRA',
    city: 'Ikeja',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '',
    verificationStatus: 'pending',
    totalUnits: 3,
    occupiedUnits: 1,
    monthlyRevenue: 450_000,
    createdAt: '2025-04-20T00:00:00.000Z',
  },
];

const mockUnits: Unit[] = [
  {
    id: 'unit_001',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 1A',
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 450_000,
    occupancyStatus: 'occupied',
    tenantId: 'tenant_001',
    tenantName: 'Adaeze Okafor',
  },
  {
    id: 'unit_002',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 2B',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 320_000,
    occupancyStatus: 'occupied',
    tenantId: 'tenant_002',
    tenantName: 'Tunde Bakare',
  },
  {
    id: 'unit_003',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 3B',
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 450_000,
    occupancyStatus: 'occupied',
    tenantId: 'tenant_003',
    tenantName: 'Chuka Nwosu',
  },
  {
    id: 'unit_004',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 4A',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 320_000,
    occupancyStatus: 'vacant',
  },
  {
    id: 'unit_005',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitName: 'Unit 1A',
    bedrooms: 3,
    bathrooms: 2,
    monthlyRent: 580_000,
    occupancyStatus: 'occupied',
    tenantId: 'tenant_004',
    tenantName: 'Ifeoma Bello',
  },
  {
    id: 'unit_006',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitName: 'Unit 1B',
    bedrooms: 3,
    bathrooms: 2,
    monthlyRent: 580_000,
    occupancyStatus: 'notice_given',
    tenantId: 'tenant_005',
    tenantName: 'Segun Adeyemi',
  },
  {
    id: 'unit_007',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitName: 'Unit 2A',
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 460_000,
    occupancyStatus: 'vacant',
  },
  {
    id: 'unit_008',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitName: 'Unit A',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 450_000,
    occupancyStatus: 'occupied',
    tenantId: 'tenant_006',
    tenantName: 'Ngozi Eze',
  },
  {
    id: 'unit_009',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitName: 'Unit B',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 450_000,
    occupancyStatus: 'vacant',
  },
];

export default function LandlordUnitsPage() {
  return (
    <Suspense fallback={null}>
      <LandlordUnitsPageContent />
    </Suspense>
  );
}

function LandlordUnitsPageContent() {
  const searchParams = useSearchParams();
  const [properties] = useState<Property[]>(mockProperties);
  const [units, setUnits] = useState<Unit[]>(mockUnits);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>(
    searchParams.get('property') || 'all'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleMarkVacant = (unitId: string) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? { ...u, occupancyStatus: 'vacant', tenantId: undefined, tenantName: undefined }
          : u
      )
    );
  };

  const handleAssignTenant = (unitId: string, tenantName: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, occupancyStatus: 'occupied', tenantName } : u))
    );
  };

  const handleAddUnit = (
    data: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>
  ) => {
    const newUnit: Unit = { ...data, id: `unit_${Date.now()}`, occupancyStatus: 'vacant' };
    setUnits((prev) => [newUnit, ...prev]);
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
