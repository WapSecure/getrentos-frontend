'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileCheck } from 'lucide-react';
import { LeaseCard } from '@/components/landlord/leases/LeaseCard';
import { CreateLeaseModal } from '@/components/landlord/leases/CreateLeaseModal';
import { RenewalOfferModal } from '@/components/landlord/leases/RenewalOfferModal';
import { Button } from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Lease, LeaseStatus } from '@/types/landlord';

const statusFilters: { value: 'all' | LeaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signed', label: 'Active' },
  { value: 'sent', label: 'Sent' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

export default function LandlordLeasesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | LeaseStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);

  const { data: leases = [] } = useQuery({
    queryKey: landlordKeys.leases(),
    queryFn: () => unwrap(landlordService.listLeases()),
  });

  const { data: vacantUnits = [] } = useQuery({
    queryKey: landlordKeys.vacantUnitsForLease,
    queryFn: () => unwrap(landlordService.listVacantUnitsForLease()),
  });

  const createLeaseMutation = useMutation({
    mutationFn: ({
      data,
      sendImmediately,
    }: {
      data: Omit<Lease, 'id' | 'status' | 'createdAt'>;
      sendImmediately: boolean;
    }) => {
      const { unitId, tenantName, leaseStart, leaseEnd, rentAmount, securityDeposit } = data;
      return unwrap(
        landlordService.createLease(
          { unitId, tenantName, leaseStart, leaseEnd, rentAmount, securityDeposit },
          sendImmediately
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leases() });
      queryClient.invalidateQueries({ queryKey: landlordKeys.vacantUnitsForLease });
    },
  });

  const sendLeaseMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.sendLease(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: landlordKeys.leases() }),
  });

  const renewLeaseMutation = useMutation({
    mutationFn: ({
      leaseId,
      newRent,
      newEndDate,
    }: {
      leaseId: string;
      newRent: number;
      newEndDate: string;
    }) => unwrap(landlordService.renewLease(leaseId, newRent, newEndDate)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leases() });
      setRenewingLease(null);
    },
  });

  const handleCreateLease = (
    data: Omit<Lease, 'id' | 'status' | 'createdAt'>,
    sendImmediately: boolean
  ) => createLeaseMutation.mutate({ data, sendImmediately });

  const handleSendLease = (id: string) => sendLeaseMutation.mutate(id);

  const handleSendRenewalOffer = (leaseId: string, newRent: number, newEndDate: string) =>
    renewLeaseMutation.mutate({ leaseId, newRent, newEndDate });

  const filteredLeases = useMemo(
    () => leases.filter((l) => filter === 'all' || l.status === filter),
    [leases, filter]
  );

  const activeLeaseCount = useMemo(
    () => leases.filter((l) => l.status === 'signed').length,
    [leases]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leases</h1>
          <p className="text-muted-foreground mt-1">
            {activeLeaseCount} active lease{activeLeaseCount === 1 ? '' : 's'}
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
