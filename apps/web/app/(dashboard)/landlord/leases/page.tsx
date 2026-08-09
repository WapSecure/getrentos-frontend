'use client';

import { useState, useEffect } from 'react';
import { Plus, FileCheck } from 'lucide-react';
import { LeaseCard } from '@/components/landlord/leases/LeaseCard';
import { CreateLeaseModal } from '@/components/landlord/leases/CreateLeaseModal';
import { RenewalOfferModal } from '@/components/landlord/leases/RenewalOfferModal';
import { Button } from '@/components/ui/Button';
import { landlordService } from '@/services/landlordService';
import type { Lease, LeaseStatus, Unit } from '@/types/landlord';

const statusFilters: { value: 'all' | LeaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signed', label: 'Active' },
  { value: 'sent', label: 'Sent' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

export default function LandlordLeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [vacantUnits, setVacantUnits] = useState<Unit[]>([]);
  const [filter, setFilter] = useState<'all' | LeaseStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [leasesRes, vacantUnitsRes] = await Promise.all([
        landlordService.listLeases(),
        landlordService.listVacantUnitsForLease(),
      ]);
      if (leasesRes.success && leasesRes.data) setLeases(leasesRes.data);
      if (vacantUnitsRes.success && vacantUnitsRes.data) setVacantUnits(vacantUnitsRes.data);
    };

    fetchData();
  }, []);

  const handleCreateLease = async (
    data: Omit<Lease, 'id' | 'status' | 'createdAt'>,
    sendImmediately: boolean
  ) => {
    const { unitId, tenantName, leaseStart, leaseEnd, rentAmount, securityDeposit } = data;
    const response = await landlordService.createLease(
      { unitId, tenantName, leaseStart, leaseEnd, rentAmount, securityDeposit },
      sendImmediately
    );
    if (response.success && response.data) {
      setLeases((prev) => [response.data!, ...prev]);
      setVacantUnits((prev) => prev.filter((u) => u.id !== data.unitId));
    }
  };

  const handleSendLease = async (id: string) => {
    const response = await landlordService.sendLease(id);
    if (response.success && response.data) {
      setLeases((prev) => prev.map((l) => (l.id === id ? response.data! : l)));
    }
  };

  const handleSendRenewalOffer = async (leaseId: string, newRent: number, newEndDate: string) => {
    const response = await landlordService.renewLease(leaseId, newRent, newEndDate);
    if (response.success && response.data) {
      setLeases((prev) => prev.map((l) => (l.id === leaseId ? response.data! : l)));
    }
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
