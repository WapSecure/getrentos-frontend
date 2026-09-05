'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { ResidentGovernanceRecordRow } from '@/components/estate/governance/ResidentGovernanceRecordRow';
import { SignGovernanceRecordModal } from '@/components/estate/governance/SignGovernanceRecordModal';
import type { GovernanceRecord } from '@/types/estate';

export default function ResidentGovernancePage() {
  const queryClient = useQueryClient();
  const [signingRecord, setSigningRecord] = useState<GovernanceRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: estateResidentKeys.governance,
    queryFn: () => unwrap(estateResidentService.listMyEstateGovernanceRecords()),
  });

  const signRecord = useMutation({
    mutationFn: ({ recordId, signatureData }: { recordId: string; signatureData: string }) =>
      unwrap(estateResidentService.signGovernanceRecord(recordId, signatureData)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estateResidentKeys.governance });
      setSigningRecord(null);
    },
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Governance</h1>
        <p className="text-muted-foreground mt-1">Bylaws and meeting minutes for your estate</p>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : records.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={BookOpen}
            title="No governance records yet"
            description="Bylaws and meeting minutes your estate manager uploads will show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {records.map((record) => (
            <ResidentGovernanceRecordRow
              key={record.id}
              record={record}
              onSign={() => setSigningRecord(record)}
            />
          ))}
        </div>
      )}

      <SignGovernanceRecordModal
        record={signingRecord}
        onClose={() => setSigningRecord(null)}
        onSign={(recordId, signatureData) => signRecord.mutate({ recordId, signatureData })}
        isPending={signRecord.isPending}
      />
    </>
  );
}
