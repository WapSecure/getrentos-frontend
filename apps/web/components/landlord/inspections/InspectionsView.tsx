'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ClipboardCheck } from 'lucide-react';
import {
  Button,
  Pagination,
  PageErrorState,
  PageLoadingState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { InspectionCard } from '@/components/landlord/inspections/InspectionCard';
import { CreateInspectionModal } from '@/components/landlord/inspections/CreateInspectionModal';
import { InspectionDetailModal } from '@/components/landlord/inspections/InspectionDetailModal';
import {
  inspectionService,
  INSPECTION_STATUS_LABELS,
  type CreateInspectionInput,
  type InspectionStatus,
} from '@/services/inspectionService';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

const statusFilters: { value: 'all' | InspectionStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'DRAFT', label: INSPECTION_STATUS_LABELS.DRAFT },
  { value: 'COMPLETED', label: INSPECTION_STATUS_LABELS.COMPLETED },
  { value: 'SHARED', label: INSPECTION_STATUS_LABELS.SHARED },
];

const PAGE_SIZE = 12;

/**
 * The inspections screen. Role-agnostic: it talks to the /inspections API, which
 * any property-controller (landlord, owner, or manager) may use, so the landlord
 * and owner portals both render this.
 */
export function InspectionsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | InspectionStatus>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openInspectionId, setOpenInspectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const status = filter === 'all' ? undefined : filter;

  const inspectionsQuery = useQuery({
    queryKey: [...landlordKeys.inspections({ status }), { page }],
    queryFn: () => unwrap(inspectionService.list({ status, page, pageSize: PAGE_SIZE })),
  });
  const { data, isLoading } = inspectionsQuery;
  const inspections = data?.items ?? [];
  const total = data?.total ?? 0;

  // Properties feed the create modal's picker.
  const { data: propertiesData } = useQuery({
    queryKey: landlordKeys.properties,
    queryFn: () => unwrap(landlordService.listProperties({ pageSize: 100 })),
  });
  const properties = (propertiesData?.items ?? []).map((p) => ({ id: p.id, name: p.name }));

  const createMutation = useMutation({
    mutationFn: (input: CreateInspectionInput) => unwrap(inspectionService.create(input)),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'inspections'] });
      setIsCreateOpen(false);
      setOpenInspectionId(created.id);
    },
    onError: (error: Error) =>
      setToast({ message: error.message || 'Could not create the inspection.', variant: 'error' }),
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inspections</h1>
          <p className="mt-1 text-muted-foreground">
            Condition reports at move-in, move-out, and routine checks.
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New inspection
        </Button>
      </div>

      <div className="mb-6 flex w-fit gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoadingState />
      ) : inspectionsQuery.isError ? (
        <PageErrorState
          title="Inspections are unavailable"
          description="We could not load condition reports. No inspection has been changed."
          onRetry={() => void inspectionsQuery.refetch()}
          isRetrying={inspectionsQuery.isFetching}
        />
      ) : inspections.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-foreground">
            {filter === 'all' ? 'No inspections yet' : `No ${filter.toLowerCase()} inspections`}
          </p>
          {filter !== 'all' && (
            <Button variant="outline" className="mt-5" onClick={() => setFilter('all')}>
              View all inspections
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {inspections.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              onOpen={setOpenInspectionId}
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

      <CreateInspectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        properties={properties}
        onCreate={(input) => createMutation.mutate(input)}
        isPending={createMutation.isPending}
      />

      <InspectionDetailModal
        inspectionId={openInspectionId}
        onClose={() => setOpenInspectionId(null)}
        onChanged={() => {
          /* list is invalidated by the modal's mutations */
        }}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
