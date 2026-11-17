'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileCheck } from '@sureground/icons';
import { RecordToolbar } from '@/components/shared/records/RecordParts';
import { LeaseCard } from '@/components/landlord/leases/LeaseCard';
import { CreateLeaseModal } from '@/components/landlord/leases/CreateLeaseModal';
import { RenewalOfferModal } from '@/components/landlord/leases/RenewalOfferModal';
import { RentScheduleModal } from '@/components/landlord/leases/RentScheduleModal';
import { SignLeaseModal } from '@/components/landlord/leases/SignLeaseModal';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  Skeleton,
  ToggleChip,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { landlordService } from '@/services/landlordService';
import { formatCurrency, formatDate } from '@/lib/format';
import { leaseRentSuffix } from '@/lib/leaseTerm';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Lease, LeaseStatus } from '@/types/landlord';
import { LandlordTenanciesNav } from '@/components/shared/navigation/WorkflowNavs';

const statusFilters: { value: 'all' | LeaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signed', label: 'Active' },
  { value: 'sent', label: 'Sent' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

const PAGE_SIZE = 10;

function LandlordLeasesPageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const [onlyLeaseId, setOnlyLeaseId] = useState<string | null>(searchParams.get('lease'));
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | LeaseStatus>(
    statusParam === 'draft' ? 'draft' : 'all'
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(searchParams.get('create') === '1');
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);
  const [signingLease, setSigningLease] = useState<Lease | null>(null);
  const [billingLease, setBillingLease] = useState<Lease | null>(null);
  const [sendingLease, setSendingLease] = useState<Lease | null>(null);
  const toast = useToast();

  const {
    data,
    isLoading: isLoadingLeases,
    isError: leasesFailed,
    refetch: refetchLeases,
  } = useQuery({
    queryKey: [
      ...landlordKeys.leases(),
      {
        page,
        pageSize: PAGE_SIZE,
        status: filter === 'all' ? undefined : filter,
        leaseId: onlyLeaseId ?? undefined,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listLeases({
          status: filter === 'all' ? undefined : filter,
          leaseId: onlyLeaseId ?? undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const leases = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: activeData, isLoading: isLoadingActive } = useQuery({
    queryKey: [...landlordKeys.leases('signed'), { page: 1, pageSize: 1 }],
    queryFn: () => unwrap(landlordService.listLeases({ status: 'signed', page: 1, pageSize: 1 })),
  });
  const activeLeaseCount = activeData?.total ?? 0;

  const { data: vacantUnits = [] } = useQuery({
    queryKey: landlordKeys.vacantUnitsForLease,
    queryFn: () => unwrap(landlordService.listVacantUnitsForLease()),
  });

  const createLeaseMutation = useMutation({
    mutationFn: ({
      data,
      sendImmediately,
    }: {
      data: Omit<Lease, 'id' | 'status' | 'createdAt' | 'tenantSigned' | 'landlordSigned'>;
      sendImmediately: boolean;
    }) => {
      const {
        unitId,
        tenantName,
        tenantId,
        leaseStart,
        leaseEnd,
        rentAmount,
        rentPeriod,
        securityDeposit,
      } = data;
      return unwrap(
        landlordService.createLease(
          {
            unitId,
            tenantName,
            tenantId,
            leaseStart,
            leaseEnd,
            rentAmount,
            // Forward the resolved cadence, or a manually drafted lease saves with no period.
            rentPeriod,
            securityDeposit,
          },
          sendImmediately
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      queryClient.invalidateQueries({ queryKey: landlordKeys.vacantUnitsForLease });
    },
  });

  const sendLeaseMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.sendLease(id)),
    onSuccess: () => {
      setSendingLease(null);
      toast.success('Lease sent. The tenant is asked to sign it.');
      return queryClient.invalidateQueries({ queryKey: ['landlord', 'leases'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to send this lease.'),
  });

  const signLeaseMutation = useMutation({
    mutationFn: ({ id, signatureData }: { id: string; signatureData: string }) =>
      unwrap(landlordService.signLease(id, signatureData)),
    onSuccess: (updated) => {
      queryClient.setQueriesData<{ items: Lease[]; total: number } | undefined>(
        { queryKey: ['landlord', 'leases'] },
        (old) =>
          old ? { ...old, items: old.items.map((l) => (l.id === updated.id ? updated : l)) } : old
      );
      queryClient.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      setSigningLease(null);
      toast.success(
        updated.status === 'signed'
          ? 'Lease fully executed: both parties have signed.'
          : 'Your signature was recorded. Waiting on the tenant.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to sign this lease.');
    },
  });

  const renewLeaseMutation = useMutation({
    mutationFn: ({
      leaseId,
      newRent,
      newEndDate,
      message,
    }: {
      leaseId: string;
      newRent: number;
      newEndDate: string;
      message: string;
    }) => unwrap(landlordService.renewLease(leaseId, newRent, newEndDate, message)),
    onSuccess: (_lease, { message }) => {
      toast.success(
        message.trim() ? 'Renewal offer sent, with your note as a message.' : 'Renewal offer sent.'
      );
      queryClient.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      setRenewingLease(null);
    },
  });

  const handleCreateLease = async (
    data: Omit<Lease, 'id' | 'status' | 'createdAt' | 'tenantSigned' | 'landlordSigned'>,
    sendImmediately: boolean
  ) => {
    try {
      await createLeaseMutation.mutateAsync({ data, sendImmediately });
      return true;
    } catch {
      return false;
    }
  };

  const handleSendLease = (id: string) => setSendingLease(leases.find((l) => l.id === id) ?? null);

  const handleSignLease = (id: string, signatureData: string) =>
    signLeaseMutation.mutate({ id, signatureData });

  const handleSendRenewalOffer = async (
    leaseId: string,
    newRent: number,
    newEndDate: string,
    message: string
  ) => {
    try {
      await renewLeaseMutation.mutateAsync({ leaseId, newRent, newEndDate, message });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Lettings"
        title="Leases"
        description={
          <>
            {isLoadingActive ? (
              <Skeleton className="inline-block h-4 w-40 max-w-full align-middle" />
            ) : (
              `${activeLeaseCount} active lease${activeLeaseCount === 1 ? '' : 's'}`
            )}
          </>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create lease
          </Button>
        }
      />
      <LandlordTenanciesNav />

      {onlyLeaseId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">Showing one lease.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOnlyLeaseId(null);
              setPage(1);
              window.history.replaceState(null, '', window.location.pathname);
            }}
          >
            Show all leases
          </Button>
        </div>
      )}

      <RecordToolbar>
        <div
          className="flex gap-2 overflow-x-auto"
          role="group"
          aria-label="Filter leases by status"
        >
          {statusFilters.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </RecordToolbar>

      {isLoadingLeases ? (
        <ListSkeleton rows={6} variant="cards" label="Loading leases" />
      ) : leasesFailed && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your leases"
          onRetry={() => void refetchLeases()}
        />
      ) : leases.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No leases found"
          description="Leases you create or draft from approved applications appear here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leases.map((lease, index) => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              delay={index * 0.05}
              onSendLease={handleSendLease}
              onRequestRenewal={setRenewingLease}
              onSignLease={setSigningLease}
              onOpenSchedule={setBillingLease}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <ConfirmDialog
        open={sendingLease !== null}
        onOpenChange={(open) => {
          if (!open) setSendingLease(null);
        }}
        title="Send this lease for signature?"
        description={
          sendingLease
            ? `${sendingLease.tenantName} is asked to sign the lease for ${sendingLease.propertyName} · ${sendingLease.unitName}: ${formatCurrency(sendingLease.rentAmount)}${leaseRentSuffix(sendingLease.rentPeriod, sendingLease.leaseStart, sendingLease.leaseEnd)}, ${formatDate(sendingLease.leaseStart, 'long')} to ${formatDate(sendingLease.leaseEnd, 'long')}. Check the rent and dates before you send it.`
            : ''
        }
        confirmLabel="Send lease"
        onConfirm={() => sendingLease && sendLeaseMutation.mutateAsync(sendingLease.id)}
        isLoading={sendLeaseMutation.isPending}
      />

      <CreateLeaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        vacantUnits={vacantUnits}
        onSave={handleCreateLease}
      />

      <RentScheduleModal
        key={billingLease?.id ?? 'none-billing'}
        lease={billingLease}
        onClose={() => setBillingLease(null)}
      />

      <RenewalOfferModal
        key={renewingLease?.id ?? 'none'}
        lease={renewingLease}
        onClose={() => setRenewingLease(null)}
        onSend={handleSendRenewalOffer}
      />

      <SignLeaseModal
        key={signingLease?.id ?? 'none-sign'}
        lease={signingLease}
        onClose={() => setSigningLease(null)}
        onSign={handleSignLease}
        isPending={signLeaseMutation.isPending}
      />
    </>
  );
}

export default function LandlordLeasesPage() {
  return (
    <Suspense fallback={null}>
      <LandlordLeasesPageContent />
    </Suspense>
  );
}
