'use client';

import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { TenantCard } from '@/components/landlord/tenants/TenantCard';
import type { Tenant, RentPaymentStatus } from '@/types/landlord';

const mockTenants: Tenant[] = [
  {
    id: 'tenant_001',
    name: 'Adaeze Okafor',
    email: 'adaeze.okafor@example.com',
    phone: '+234 803 123 4567',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_001',
    unitName: 'Unit 1A',
    leaseId: 'lease_001',
    moveInDate: '2025-02-01T00:00:00.000Z',
    trustScore: 92,
    verified: true,
    rentStatus: 'paid',
  },
  {
    id: 'tenant_002',
    name: 'Tunde Bakare',
    email: 'tunde.bakare@example.com',
    phone: '+234 805 234 5678',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_002',
    unitName: 'Unit 2B',
    leaseId: 'lease_002',
    moveInDate: '2025-03-15T00:00:00.000Z',
    trustScore: 78,
    verified: true,
    rentStatus: 'pending',
  },
  {
    id: 'tenant_003',
    name: 'Chuka Nwosu',
    email: 'chuka.nwosu@example.com',
    phone: '+234 812 345 6789',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_003',
    unitName: 'Unit 3B',
    leaseId: 'lease_003',
    moveInDate: '2024-11-10T00:00:00.000Z',
    trustScore: 65,
    verified: true,
    rentStatus: 'overdue',
  },
  {
    id: 'tenant_004',
    name: 'Ifeoma Bello',
    email: 'ifeoma.bello@example.com',
    phone: '+234 701 456 7890',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_005',
    unitName: 'Unit 1A',
    leaseId: 'lease_004',
    moveInDate: '2025-06-01T00:00:00.000Z',
    trustScore: 88,
    verified: true,
    rentStatus: 'paid',
  },
  {
    id: 'tenant_005',
    name: 'Segun Adeyemi',
    email: 'segun.adeyemi@example.com',
    phone: '+234 706 567 8901',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_006',
    unitName: 'Unit 1B',
    leaseId: 'lease_005',
    moveInDate: '2024-08-20T00:00:00.000Z',
    trustScore: 71,
    verified: false,
    rentStatus: 'processing',
  },
  {
    id: 'tenant_006',
    name: 'Ngozi Eze',
    email: 'ngozi.eze@example.com',
    phone: '+234 809 678 9012',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitId: 'unit_008',
    unitName: 'Unit A',
    leaseId: 'lease_006',
    moveInDate: '2025-05-05T00:00:00.000Z',
    trustScore: 95,
    verified: true,
    rentStatus: 'paid',
  },
];

const rentStatusFilters: { value: 'all' | RentPaymentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

export default function LandlordTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [rentFilter, setRentFilter] = useState<'all' | RentPaymentStatus>('all');

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = rentFilter === 'all' || t.rentStatus === rentFilter;
    return matchesSearch && matchesFilter;
  });

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
          <input
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
