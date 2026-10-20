'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock } from 'lucide-react';
import { ViewingRequestCard } from '@/components/buyer/viewings/ViewingRequestCard';
import { RequestViewingModal } from '@/components/buyer/viewings/RequestViewingModal';
import { Button, Pagination, QueryState, Skeleton, useToast } from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';

function BuyerViewingsPageContent() {
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get('property') || undefined;
  const queryClient = useQueryClient();
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const toast = useToast();

  const viewingsQuery = useQuery({
    queryKey: [...buyerKeys.viewings, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(buyerService.listViewings({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const viewingsData = viewingsQuery.data;
  const requests = viewingsData?.items ?? [];
  const total = viewingsData?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: buyerKeys.viewings });

  const createMutation = useMutation({
    mutationFn: (data: {
      listingId: string;
      scheduledAt: string;
      notes?: string;
      mode: 'IN_PERSON' | 'VIDEO';
    }) => unwrap(buyerService.requestViewing(data)),
    onSuccess: invalidate,
    onError: () => toast.error('The viewing request could not be submitted.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(buyerService.updateViewing(id, { status: 'CANCELLED' })),
    onSuccess: invalidate,
    onError: () => toast.error('The viewing request could not be cancelled.'),
  });

  const [isModalOpen, setIsModalOpen] = useState(!!defaultPropertyId);

  const handleSubmit = async (
    propertyId: string,
    date: string,
    time: string,
    notes: string,
    mode: 'IN_PERSON' | 'VIDEO'
  ) => {
    try {
      await createMutation.mutateAsync({
        listingId: propertyId,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        notes: notes || undefined,
        mode,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleCancel = (requestId: string) => {
    cancelMutation.mutate(requestId);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Viewing Requests</h1>
          <p className="text-muted-foreground mt-1">
            {viewingsQuery.isLoading ? (
              <Skeleton className="inline-block h-4 w-24 align-middle" />
            ) : (
              `${total} request${total === 1 ? '' : 's'}`
            )}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="w-fit"
          onClick={() => setIsModalOpen(true)}
        >
          Request Viewing
        </Button>
      </div>

      <QueryState
        isLoading={viewingsQuery.isLoading}
        isError={viewingsQuery.isError && !viewingsData}
        errorTitle="Viewing requests are unavailable"
        onRetry={() => void viewingsQuery.refetch()}
        isRetrying={viewingsQuery.isFetching}
        isEmpty={requests.length === 0}
        empty={{
          icon: CalendarClock,
          title: 'No viewing requests yet',
          description: 'Request a viewing from any property to schedule a tour with the owner.',
        }}
        scope="page"
        loading={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((request, index) => (
            <ViewingRequestCard
              key={request.id}
              request={request}
              delay={index * 0.05}
              onCancel={() => handleCancel(request.id)}
            />
          ))}
        </div>
      </QueryState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      <RequestViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPropertyId={defaultPropertyId}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default function BuyerViewingsPage() {
  return (
    <Suspense fallback={null}>
      <BuyerViewingsPageContent />
    </Suspense>
  );
}
