'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock } from 'lucide-react';
import { ViewingRequestCard } from '@/components/buyer/viewings/ViewingRequestCard';
import { RequestViewingModal } from '@/components/buyer/viewings/RequestViewingModal';
import { Button } from '@/components/ui/Button';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';

function BuyerViewingsPageContent() {
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get('property') || undefined;
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: buyerKeys.viewings,
    queryFn: () => unwrap(buyerService.listViewings()),
  });

  const { data: listings = [] } = useQuery({
    queryKey: buyerKeys.listings,
    queryFn: () => unwrap(buyerService.discover({})),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: buyerKeys.viewings });

  const createMutation = useMutation({
    mutationFn: (data: { listingId: string; scheduledAt: string; notes?: string }) =>
      unwrap(buyerService.requestViewing(data)),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(buyerService.updateViewing(id, { status: 'CANCELLED' })),
    onSuccess: invalidate,
  });

  const [isModalOpen, setIsModalOpen] = useState(!!defaultPropertyId);

  const handleSubmit = (propertyId: string, date: string, time: string, notes: string) => {
    createMutation.mutate({
      listingId: propertyId,
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
      notes: notes || undefined,
    });
    setIsModalOpen(false);
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
            {isLoading
              ? 'Loading…'
              : `${requests.length} request${requests.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Request Viewing
        </Button>
      </div>

      {!isLoading && requests.length === 0 ? (
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

      <RequestViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listings={listings}
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
