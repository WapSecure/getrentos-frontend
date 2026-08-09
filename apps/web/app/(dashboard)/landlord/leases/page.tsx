'use client';

import { useState } from 'react';
import { Plus, FileCheck } from 'lucide-react';
import { LeaseCard } from '@/components/landlord/leases/LeaseCard';
import { CreateLeaseModal } from '@/components/landlord/leases/CreateLeaseModal';
import { RenewalOfferModal } from '@/components/landlord/leases/RenewalOfferModal';
import { Button } from '@/components/ui/Button';
import type { Lease, LeaseStatus, Unit } from '@/types/landlord';

const mockLeases: Lease[] = [
  {
    id: 'lease_001',
    tenantId: 'tenant_001',
    tenantName: 'Adaeze Okafor',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_001',
    unitName: 'Unit 1A',
    leaseStart: '2025-02-01',
    leaseEnd: '2027-01-31',
    rentAmount: 450_000,
    securityDeposit: 450_000,
    status: 'signed',
    createdAt: '2025-01-20T00:00:00.000Z',
  },
  {
    id: 'lease_003',
    tenantId: 'tenant_003',
    tenantName: 'Chuka Nwosu',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_003',
    unitName: 'Unit 3B',
    leaseStart: '2024-11-10',
    leaseEnd: '2026-08-21',
    rentAmount: 450_000,
    securityDeposit: 450_000,
    status: 'signed',
    createdAt: '2024-11-01T00:00:00.000Z',
  },
  {
    id: 'lease_004',
    tenantId: 'tenant_004',
    tenantName: 'Ifeoma Bello',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_005',
    unitName: 'Unit 1A',
    leaseStart: '2025-06-01',
    leaseEnd: '2026-05-31',
    rentAmount: 580_000,
    securityDeposit: 580_000,
    status: 'signed',
    createdAt: '2025-05-20T00:00:00.000Z',
  },
  {
    id: 'lease_005',
    tenantId: 'tenant_005',
    tenantName: 'Segun Adeyemi',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_006',
    unitName: 'Unit 1B',
    leaseStart: '2024-08-20',
    leaseEnd: '2025-08-19',
    rentAmount: 580_000,
    status: 'expired',
    createdAt: '2024-08-10T00:00:00.000Z',
  },
];

const mockVacantUnits: Unit[] = [
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

const statusFilters: { value: 'all' | LeaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signed', label: 'Active' },
  { value: 'sent', label: 'Sent' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

export default function LandlordLeasesPage() {
  const [leases, setLeases] = useState<Lease[]>(mockLeases);
  const [vacantUnits, setVacantUnits] = useState<Unit[]>(mockVacantUnits);
  const [filter, setFilter] = useState<'all' | LeaseStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);

  const handleCreateLease = (
    data: Omit<Lease, 'id' | 'status' | 'createdAt'>,
    sendImmediately: boolean
  ) => {
    const newLease: Lease = {
      ...data,
      id: `lease_${Date.now()}`,
      status: sendImmediately ? 'sent' : 'draft',
      createdAt: new Date().toISOString(),
    };
    setLeases((prev) => [newLease, ...prev]);
    setVacantUnits((prev) => prev.filter((u) => u.id !== data.unitId));
  };

  const handleSendLease = (id: string) => {
    setLeases((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sent' } : l)));
  };

  const handleSendRenewalOffer = (leaseId: string, newRent: number, newEndDate: string) => {
    setLeases((prev) =>
      prev.map((l) =>
        l.id === leaseId ? { ...l, rentAmount: newRent, leaseEnd: newEndDate, status: 'sent' } : l
      )
    );
    setRenewingLease(null);
  };

  const filteredLeases = leases.filter((l) => filter === 'all' || l.status === filter);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leases</h1>
          <p className="text-muted-foreground mt-1">
            {leases.filter((l) => l.status === 'signed').length} active lease
            {leases.filter((l) => l.status === 'signed').length === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Lease
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-6 overflow-x-auto">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredLeases.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FileCheck className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No leases found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeases.map((lease, index) => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              delay={index * 0.05}
              onSendLease={handleSendLease}
              onRequestRenewal={setRenewingLease}
            />
          ))}
        </div>
      )}

      <CreateLeaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        vacantUnits={vacantUnits}
        onSave={handleCreateLease}
      />

      <RenewalOfferModal
        key={renewingLease?.id ?? 'none'}
        lease={renewingLease}
        onClose={() => setRenewingLease(null)}
        onSend={handleSendRenewalOffer}
      />
    </>
  );
}
