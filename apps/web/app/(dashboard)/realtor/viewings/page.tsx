'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock } from 'lucide-react';
import { ViewingCard } from '@/components/realtor/viewings/ViewingCard';
import { ScheduleViewingModal } from '@/components/realtor/viewings/ScheduleViewingModal';
import type { CreateViewingInput } from '@/components/realtor/viewings/ScheduleViewingModal';
import {
  Button,
  PageErrorState,
  PageLoadingState,
  Pagination,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import type { ViewingAppointment } from '@/types/realtor';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorViewing, realtorService } from '@/services/realtorService';

const PAGE_SIZE = 10;

function RealtorViewingsPageContent() {
  const searchParams = useSearchParams();
  const defaultLeadId = searchParams.get('lead') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(!!defaultLeadId);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const queryClient = useQueryClient();
  const viewingsQuery = useQuery({
    queryKey: [...realtorKeys.viewings, { page, pageSize: PAGE_SIZE }],
    queryFn: async () => {
      const result = await unwrap(realtorService.listViewings({ page, pageSize: PAGE_SIZE }));
      return { ...result, items: result.items.map(mapRealtorViewing) };
    },
  });
  const { data, isLoading } = viewingsQuery;
  const viewings = data?.items ?? [];
  const total = data?.total ?? 0;
  const createViewing = useMutation({
    mutationFn: (appointment: Omit<ViewingAppointment, 'id' | 'status'> & { leadId: string }) =>
      unwrap(
        realtorService.createViewing({
          listingId: appointment.listingId,
          leadId: appointment.leadId,
          scheduledAt: (() => {
            const [y, m, d] = appointment.scheduledDate.split('-').map(Number);
            const [hh, mm] = appointment.scheduledTime.split(':').map(Number);
            return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0).toISOString();
          })(),
          notes: appointment.notes,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.viewings });
      setPage(1);
      setIsModalOpen(false);
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to schedule this viewing. Please try again.',
        variant: 'error',
      }),
  });
  const updateViewing = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) =>
      unwrap(realtorService.updateViewingStatus(id, status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.viewings }),
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to update this viewing. Please try again.',
        variant: 'error',
      }),
  });

  const handleSubmit = async (appointment: CreateViewingInput) => {
    try {
      await createViewing.mutateAsync(appointment);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Viewings</h1>
          <p className="text-muted-foreground mt-1">
            {total} scheduled tour{total === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Schedule Viewing
        </Button>
      </div>

      {isLoading ? (
        <PageLoadingState />
      ) : viewingsQuery.isError ? (
        <PageErrorState
          title="Viewings are unavailable"
          description="We could not load your scheduled tours. Please try again."
          onRetry={() => void viewingsQuery.refetch()}
          isRetrying={viewingsQuery.isFetching}
        />
      ) : viewings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <CalendarClock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No viewings scheduled</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Schedule a tour with one of your leads to get started.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => setIsModalOpen(true)}>
            Schedule a viewing
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {viewings.map((viewing) => (
            <ViewingCard
              key={viewing.id}
              viewing={viewing}
              onConfirm={() => updateViewing.mutate({ id: viewing.id, status: 'CONFIRMED' })}
              onComplete={() => updateViewing.mutate({ id: viewing.id, status: 'COMPLETED' })}
              onCancel={() => updateViewing.mutate({ id: viewing.id, status: 'CANCELLED' })}
              isUpdating={updateViewing.isPending && updateViewing.variables?.id === viewing.id}
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

      <ScheduleViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultLeadId={defaultLeadId}
        onSubmit={handleSubmit}
        isSubmitting={createViewing.isPending}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}

export default function RealtorViewingsPage() {
  return (
    <Suspense fallback={null}>
      <RealtorViewingsPageContent />
    </Suspense>
  );
}
