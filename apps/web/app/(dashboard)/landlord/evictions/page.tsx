'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gavel, Plus, TriangleAlert } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { EvictionCaseCard } from '@/components/landlord/evictions/EvictionCaseCard';
import { InitiateEvictionModal } from '@/components/landlord/evictions/InitiateEvictionModal';
import { EvictionCaseDetailModal } from '@/components/landlord/evictions/EvictionCaseDetailModal';

export default function LandlordEvictionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const { data: cases = [] } = useQuery({
    queryKey: landlordKeys.evictions,
    queryFn: () => unwrap(landlordService.listEvictions()),
  });
  const { data: signedLeases = [] } = useQuery({
    queryKey: landlordKeys.leases('signed'),
    queryFn: () => unwrap(landlordService.listLeases('signed')),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: landlordKeys.evictions });

  const initiate = useMutation({
    mutationFn: ({ leaseId, reason }: { leaseId: string; reason: string }) =>
      unwrap(landlordService.initiateEviction(leaseId, reason)),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
    },
  });

  const issueNotice = useMutation({
    mutationFn: ({ id, cureDays }: { id: string; cureDays: number }) =>
      unwrap(landlordService.issueEvictionNotice(id, cureDays)),
    onSuccess: invalidate,
  });

  const markFiled = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.markEvictionFiled(id)),
    onSuccess: invalidate,
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolutionNotes }: { id: string; resolutionNotes?: string }) =>
      unwrap(landlordService.resolveEviction(id, resolutionNotes)),
    onSuccess: () => {
      invalidate();
      setActiveCaseId(null);
    },
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.withdrawEviction(id)),
    onSuccess: () => {
      invalidate();
      setActiveCaseId(null);
    },
  });

  const activeCase = cases.find((c) => c.id === activeCaseId) || null;
  const isActing =
    issueNotice.isPending || markFiled.isPending || resolve.isPending || withdraw.isPending;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evictions</h1>
          <p className="text-muted-foreground mt-1">
            {cases.length} case{cases.length === 1 ? '' : 's'} tracked
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Initiate Case
        </Button>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 flex gap-2 text-xs text-amber-800 dark:text-amber-300 mb-6">
        <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          These are internal draft/tracking records only, not certified legal notices. Review each
          case with qualified legal counsel and confirm compliance with your state&apos;s tenancy
          law before serving anything on a tenant.
        </p>
      </div>

      {cases.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Gavel}
            title="No eviction cases"
            description="Start a case for a signed lease if a tenant relationship needs to move to a formal process."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {cases.map((evictionCase) => (
            <EvictionCaseCard
              key={evictionCase.id}
              evictionCase={evictionCase}
              onClick={() => setActiveCaseId(evictionCase.id)}
            />
          ))}
        </div>
      )}

      <InitiateEvictionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leases={signedLeases}
        onSubmit={(leaseId, reason) => initiate.mutate({ leaseId, reason })}
        isSubmitting={initiate.isPending}
      />

      <EvictionCaseDetailModal
        evictionCase={activeCase}
        onClose={() => setActiveCaseId(null)}
        onIssueNotice={(id, cureDays) => issueNotice.mutate({ id, cureDays })}
        onMarkFiled={(id) => markFiled.mutate(id)}
        onResolve={(id, resolutionNotes) => resolve.mutate({ id, resolutionNotes })}
        onWithdraw={(id) => withdraw.mutate(id)}
        onDownloadPdf={(id) => landlordService.downloadEvictionNoticePdf(id)}
        isActing={isActing}
      />
    </>
  );
}
