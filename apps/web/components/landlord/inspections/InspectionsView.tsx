'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ClipboardCheck } from 'lucide-react';
import {
  Button,
  CardSkeleton,
  EmptyState,
  Pagination,
  PageErrorState,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
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
  const toast = useToast();

  const status = filter === 'all' ? undefined : filter;

  const inspectionsQuery = useQuery({
    queryKey: [...landlordKeys.inspections({ status }), { page }],
    queryFn: () => unwrap(inspectionService.list({ status, page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
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
    onError: (error: Error) => toast.error(error.message || 'Could not create the inspection.'),
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

      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as 'all' | InspectionStatus);
          setPage(1);
        }}
        className="mb-6 max-w-full"
      >
        <TabsList className="max-w-full">
          {statusFilters.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : !data ? (
        <PageErrorState
          title="Inspections are unavailable"
          description="We could not load condition reports. No inspection has been changed."
          onRetry={() => void inspectionsQuery.refetch()}
          isRetrying={inspectionsQuery.isFetching}
        />
      ) : inspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={filter === 'all' ? 'No inspections yet' : `No ${filter.toLowerCase()} inspections`}
          action={
            filter !== 'all' ? (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View all inspections
              </Button>
            ) : undefined
          }
        />
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
    </>
  );
}
