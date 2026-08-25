'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { UploadGovernanceRecordModal } from '@/components/estate/governance/UploadGovernanceRecordModal';
import { GovernanceRecordRow } from '@/components/estate/governance/GovernanceRecordRow';
import type { GovernanceRecordType } from '@/types/estate';

const typeFilters: { value: GovernanceRecordType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bylaws', label: 'Bylaws' },
  { value: 'meeting_minutes', label: 'Meeting Minutes' },
  { value: 'other', label: 'Other' },
];

export default function EstateGovernancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<GovernanceRecordType | 'all'>('all');

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: records = [], isLoading: isRecordsLoading } = useQuery({
    queryKey: estateKeys.governanceRecords(
      estate?.id ?? '',
      typeFilter === 'all' ? undefined : typeFilter
    ),
    queryFn: () =>
      unwrap(
        estateService.listGovernanceRecords(
          estate!.id,
          typeFilter === 'all' ? undefined : typeFilter
        )
      ),
    enabled: !!estate,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'governanceRecords'] });
  };

  const uploadRecord = useMutation({
    mutationFn: (data: Parameters<typeof estateService.uploadGovernanceRecord>[1]) =>
      unwrap(estateService.uploadGovernanceRecord(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setIsUploadOpen(false);
    },
  });

  const removeRecord = useMutation({
    mutationFn: (recordId: string) =>
      unwrap(estateService.removeGovernanceRecord(estate!.id, recordId)),
    onSuccess: invalidate,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Governance</h1>
          <p className="text-muted-foreground mt-1">
            {records.length} record{records.length === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsUploadOpen(true)}>
          <Plus className="w-4 h-4" />
          Upload Record
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {typeFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={typeFilter === filter.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isRecordsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : records.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={BookOpen}
            title="No governance records yet"
            description="Upload bylaws or meeting minutes so they survive committee turnover."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {records.map((record) => (
            <GovernanceRecordRow
              key={record.id}
              record={record}
              onRemove={() => removeRecord.mutate(record.id)}
            />
          ))}
        </div>
      )}

      <UploadGovernanceRecordModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={(data) => uploadRecord.mutate(data)}
        isSubmitting={uploadRecord.isPending}
      />
    </>
  );
}
