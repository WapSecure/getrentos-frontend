'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock } from 'lucide-react';
import { ViewingRequestCard } from '@/components/buyer/viewings/ViewingRequestCard';
import { RequestViewingModal } from '@/components/buyer/viewings/RequestViewingModal';
import { Button, PageErrorState, PageLoadingState, Pagination, Toast } from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';

function BuyerViewingsPageContent() {
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get('property') || undefined;
  const queryClient = useQueryClient();
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const viewingsQuery = useQuery({
    queryKey: [...buyerKeys.viewings, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(buyerService.listViewings({ page, pageSize: PAGE_SIZE })),
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
    onError: () => setErrorMessage('The viewing request could not be submitted.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(buyerService.updateViewing(id, { status: 'CANCELLED' })),
    onSuccess: invalidate,
    onError: () => setErrorMessage('The viewing request could not be cancelled.'),
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

  if (viewingsQuery.isLoading) return <PageLoadingState />;
  if (viewingsQuery.isError) {
    return (
      <PageErrorState
        title="Viewing requests are unavailable"
        onRetry={() => void viewingsQuery.refetch()}
        isRetrying={viewingsQuery.isFetching}
      />
    );
  }

  return (
    <>
      {errorMessage && (
        <Toast message={errorMessage} variant="error" onClose={() => setErrorMessage(null)} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Viewing Requests</h1>
          <p className="text-muted-foreground mt-1">
            {total} request{total === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Request Viewing
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <CalendarClock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No viewing requests yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Request a viewing from any property to schedule a tour with the owner.
          </p>
        </div>
      ) : (
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
      )}

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
